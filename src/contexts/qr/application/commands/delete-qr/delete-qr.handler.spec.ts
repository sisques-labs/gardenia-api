import { EventBus } from '@nestjs/cqrs';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { IQrWriteRepository } from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { AssertQrExistsService } from '@contexts/qr/application/services/write/assert-qr-exists/assert-qr-exists.service';
import { DeleteQrCommand } from './delete-qr.command';
import { DeleteQrCommandHandler } from './delete-qr.handler';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('DeleteQrCommandHandler', () => {
  let handler: DeleteQrCommandHandler;
  let writeRepository: jest.Mocked<IQrWriteRepository>;
  let assertQrExistsService: jest.Mocked<AssertQrExistsService>;
  let eventBus: jest.Mocked<EventBus>;
  let qr: jest.Mocked<QrAggregate>;

  beforeEach(() => {
    jest.clearAllMocks();

    qr = {
      delete: jest.fn(),
      getUncommittedEvents: jest.fn().mockReturnValue([]),
      commit: jest.fn(),
    } as unknown as jest.Mocked<QrAggregate>;

    writeRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IQrWriteRepository>;

    assertQrExistsService = {
      execute: jest.fn().mockResolvedValue(qr),
    } as unknown as jest.Mocked<AssertQrExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeleteQrCommandHandler(
      writeRepository,
      assertQrExistsService,
      eventBus,
    );
  });

  it('asserts existence, deletes the QR and publishes events', async () => {
    await handler.execute(new DeleteQrCommand({ qrId: QR_ID }));

    expect(assertQrExistsService.execute).toHaveBeenCalledTimes(1);
    expect(qr.delete).toHaveBeenCalledTimes(1);
    expect(writeRepository.delete).toHaveBeenCalledWith(QR_ID);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(qr.commit).toHaveBeenCalledTimes(1);
  });

  it('propagates when the QR does not exist', async () => {
    assertQrExistsService.execute.mockRejectedValue(new Error('not found'));

    await expect(
      handler.execute(new DeleteQrCommand({ qrId: QR_ID })),
    ).rejects.toThrow('not found');
    expect(writeRepository.delete).not.toHaveBeenCalled();
  });
});
