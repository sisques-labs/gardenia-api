import { EventBus } from '@nestjs/cqrs';

import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import { IQrPngGenerator } from '@contexts/qr/domain/ports/qr-png-generator.port';
import { IQrWriteRepository } from '@contexts/qr/domain/repositories/write/qr-write.repository';

import { CreateQrCommand } from './create-qr.command';
import { CreateQrCommandHandler } from './create-qr.handler';

const TARGET_URL = 'http://localhost:3000/plants/example?spaceId=abc';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const PNG_BUFFER = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);

describe('CreateQrCommandHandler', () => {
  let handler: CreateQrCommandHandler;
  let writeRepository: jest.Mocked<IQrWriteRepository>;
  let pngGenerator: jest.Mocked<IQrPngGenerator>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation((qr) => Promise.resolve(qr)),
      delete: jest.fn(),
    } as jest.Mocked<IQrWriteRepository>;

    pngGenerator = {
      generate: jest.fn().mockResolvedValue(PNG_BUFFER),
    } as jest.Mocked<IQrPngGenerator>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateQrCommandHandler(
      writeRepository,
      pngGenerator,
      new QrBuilder(),
      eventBus,
    );
  });

  it('returns a valid UUID', async () => {
    const command = new CreateQrCommand({
      targetUrl: TARGET_URL,
      spaceId: SPACE_ID,
    });

    const id = await handler.execute(command);

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('generates the PNG from the target URL', async () => {
    const command = new CreateQrCommand({
      targetUrl: TARGET_URL,
      spaceId: SPACE_ID,
    });

    await handler.execute(command);

    expect(pngGenerator.generate).toHaveBeenCalledWith(TARGET_URL);
  });

  it('saves the aggregate with the PNG', async () => {
    const command = new CreateQrCommand({
      targetUrl: TARGET_URL,
      spaceId: SPACE_ID,
    });

    await handler.execute(command);

    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.any(Object),
      PNG_BUFFER,
    );
  });

  it('publishes events after saving', async () => {
    const command = new CreateQrCommand({
      targetUrl: TARGET_URL,
      spaceId: SPACE_ID,
    });

    await handler.execute(command);

    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('passes expiresAt to the aggregate when provided', async () => {
    const command = new CreateQrCommand({
      targetUrl: TARGET_URL,
      spaceId: SPACE_ID,
      expiresAt: FUTURE_DATE,
    });

    await handler.execute(command);

    const savedAggregate = (writeRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedAggregate.toPrimitives().expiresAt).toEqual(FUTURE_DATE);
  });

  it('passes null expiresAt when not provided', async () => {
    const command = new CreateQrCommand({
      targetUrl: TARGET_URL,
      spaceId: SPACE_ID,
    });

    await handler.execute(command);

    const savedAggregate = (writeRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedAggregate.toPrimitives().expiresAt).toBeNull();
  });
});
