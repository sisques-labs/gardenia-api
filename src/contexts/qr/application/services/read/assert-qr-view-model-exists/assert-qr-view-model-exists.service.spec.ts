import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import { IQrReadRepository } from '@contexts/qr/domain/repositories/read/qr-read.repository';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

import { AssertQrViewModelExistsService } from './assert-qr-view-model-exists.service';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01');

const buildViewModel = (): QrViewModel =>
  new QrViewModel({
    id: QR_ID,
    spaceId: '550e8400-e29b-41d4-a716-446655440002',
    targetUrl: 'http://localhost:3000/plants/example?spaceId=abc',
    generation: 1,
    expiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('AssertQrViewModelExistsService', () => {
  let service: AssertQrViewModelExistsService;
  let readRepository: jest.Mocked<IQrReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findPngById: jest.fn(),
    } as jest.Mocked<IQrReadRepository>;

    service = new AssertQrViewModelExistsService(readRepository);
  });

  describe('qr exists', () => {
    it('returns the view model when found', async () => {
      const vm = buildViewModel();
      readRepository.findById.mockResolvedValue(vm);

      const result = await service.execute(new QrIdValueObject(QR_ID));

      expect(result).toBe(vm);
      expect(readRepository.findById).toHaveBeenCalledWith(QR_ID);
    });
  });

  describe('qr does not exist', () => {
    it('throws QrNotFoundException when not found', async () => {
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(new QrIdValueObject(QR_ID))).rejects.toThrow(
        QrNotFoundException,
      );
    });

    it('includes the qr id in the thrown exception', async () => {
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(new QrIdValueObject(QR_ID))).rejects.toThrow(
        QR_ID,
      );
    });
  });
});
