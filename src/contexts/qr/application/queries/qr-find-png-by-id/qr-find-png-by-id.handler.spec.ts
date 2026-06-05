import { AssertQrViewModelExistsService } from '@contexts/qr/application/services/read/assert-qr-view-model-exists/assert-qr-view-model-exists.service';
import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';
import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import { IQrReadRepository } from '@contexts/qr/domain/repositories/read/qr-read.repository';
import { AssertQrNotExpiredDomainService } from '@contexts/qr/domain/services/assert-qr-not-expired/assert-qr-not-expired.domain-service';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

import { QrFindPngByIdQuery } from './qr-find-png-by-id.query';
import { QrFindPngByIdQueryHandler } from './qr-find-png-by-id.handler';

const QR_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const PNG_BUFFER = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const NOW = new Date('2024-01-01');
const PAST_DATE = new Date('2020-01-01');

const buildViewModel = (expiresAt: Date | null = null): QrViewModel =>
  new QrViewModel({
    id: QR_ID,
    spaceId: 'c3d4e5f6-a7b8-4012-cdef-123456789012',
    targetUrl: 'http://localhost:3000/plants/example?spaceId=abc',
    generation: 1,
    expiresAt,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('QrFindPngByIdQueryHandler', () => {
  let handler: QrFindPngByIdQueryHandler;
  let readRepository: jest.Mocked<IQrReadRepository>;
  let assertExists: jest.Mocked<AssertQrViewModelExistsService>;
  let assertNotExpired: jest.Mocked<AssertQrNotExpiredDomainService>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findPngById: jest.fn(),
    } as jest.Mocked<IQrReadRepository>;

    assertExists = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertQrViewModelExistsService>;

    assertNotExpired = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<AssertQrNotExpiredDomainService>;

    handler = new QrFindPngByIdQueryHandler(
      readRepository,
      assertExists,
      assertNotExpired,
    );
  });

  it('returns the PNG buffer when found', async () => {
    assertExists.execute.mockResolvedValue(buildViewModel());
    readRepository.findPngById.mockResolvedValue(PNG_BUFFER);

    const result = await handler.execute(
      new QrFindPngByIdQuery({ qrId: QR_ID }),
    );

    expect(result).toBe(PNG_BUFFER);
    expect(readRepository.findPngById).toHaveBeenCalledWith(QR_ID);
  });

  it('throws QrNotFoundException when PNG row is missing', async () => {
    assertExists.execute.mockResolvedValue(buildViewModel());
    readRepository.findPngById.mockResolvedValue(null);

    await expect(
      handler.execute(new QrFindPngByIdQuery({ qrId: QR_ID })),
    ).rejects.toThrow(QrNotFoundException);
  });

  it('propagates QrExpiredError from assertNotExpired', async () => {
    assertExists.execute.mockResolvedValue(buildViewModel(PAST_DATE));
    assertNotExpired.execute.mockRejectedValue(new QrExpiredError(QR_ID));

    await expect(
      handler.execute(new QrFindPngByIdQuery({ qrId: QR_ID })),
    ).rejects.toThrow(QrExpiredError);
  });
});
