import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import { IQrWriteRepository } from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';

import { AssertQrExistsService } from './assert-qr-exists.service';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertQrExistsService', () => {
  let service: AssertQrExistsService;
  let writeRepository: jest.Mocked<IQrWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IQrWriteRepository>;

    service = new AssertQrExistsService(writeRepository);
  });

  describe('qr exists', () => {
    it('returns the aggregate when found', async () => {
      const aggregate = { id: { value: QR_ID } } as unknown as QrAggregate;
      const id = new QrIdValueObject(QR_ID);
      writeRepository.findById.mockResolvedValue(aggregate);

      const result = await service.execute(id);

      expect(result).toBe(aggregate);
      expect(writeRepository.findById).toHaveBeenCalledWith(QR_ID);
    });
  });

  describe('qr does not exist', () => {
    it('throws QrNotFoundException when not found', async () => {
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(new QrIdValueObject(QR_ID))).rejects.toThrow(
        QrNotFoundException,
      );
    });

    it('includes the qr id in the thrown exception', async () => {
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(new QrIdValueObject(QR_ID))).rejects.toThrow(
        QR_ID,
      );
    });
  });
});
