import { EventBus } from '@nestjs/cqrs';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { IQrPngGenerator } from '@contexts/qr/domain/ports/qr-png-generator.port';
import { IQrWriteRepository } from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { AssertQrExistsService } from '@contexts/qr/application/services/write/assert-qr-exists/assert-qr-exists.service';
import { RegenerateQrCommand } from './regenerate-qr.command';
import { RegenerateQrCommandHandler } from './regenerate-qr.handler';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const TARGET_URL = 'https://example.com/plant/1';
const PNG = 'data:image/png;base64,zzz';

describe('RegenerateQrCommandHandler', () => {
  let handler: RegenerateQrCommandHandler;
  let writeRepository: jest.Mocked<IQrWriteRepository>;
  let pngGenerator: jest.Mocked<IQrPngGenerator>;
  let assertQrExistsService: jest.Mocked<AssertQrExistsService>;
  let eventBus: jest.Mocked<EventBus>;
  let qr: jest.Mocked<QrAggregate>;

  beforeEach(() => {
    jest.clearAllMocks();

    qr = {
      targetUrl: { value: TARGET_URL },
      regenerate: jest.fn(),
      getUncommittedEvents: jest.fn().mockReturnValue([]),
      commit: jest.fn(),
    } as unknown as jest.Mocked<QrAggregate>;

    writeRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IQrWriteRepository>;

    pngGenerator = {
      generate: jest.fn().mockResolvedValue(PNG),
    } as unknown as jest.Mocked<IQrPngGenerator>;

    assertQrExistsService = {
      execute: jest.fn().mockResolvedValue(qr),
    } as unknown as jest.Mocked<AssertQrExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new RegenerateQrCommandHandler(
      writeRepository,
      pngGenerator,
      assertQrExistsService,
      eventBus,
    );
  });

  it('regenerates the PNG from the target URL, saves and publishes events', async () => {
    await handler.execute(new RegenerateQrCommand({ qrId: QR_ID }));

    expect(pngGenerator.generate).toHaveBeenCalledWith(TARGET_URL);
    expect(qr.regenerate).toHaveBeenCalledTimes(1);
    expect(writeRepository.save).toHaveBeenCalledWith(qr, PNG);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(qr.commit).toHaveBeenCalledTimes(1);
  });

  it('does not save when PNG generation fails', async () => {
    pngGenerator.generate.mockRejectedValue(new Error('png error'));

    await expect(
      handler.execute(new RegenerateQrCommand({ qrId: QR_ID })),
    ).rejects.toThrow('png error');
    expect(writeRepository.save).not.toHaveBeenCalled();
    expect(qr.regenerate).not.toHaveBeenCalled();
  });
});
