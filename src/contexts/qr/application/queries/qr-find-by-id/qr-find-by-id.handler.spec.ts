import { AssertQrNotExpiredService } from '@contexts/qr/application/services/read/assert-qr-not-expired/assert-qr-not-expired.service';
import { AssertQrViewModelExistsService } from '@contexts/qr/application/services/read/assert-qr-view-model-exists/assert-qr-view-model-exists.service';
import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

import { QrFindByIdQuery } from './qr-find-by-id.query';
import { QrFindByIdQueryHandler } from './qr-find-by-id.handler';

const QR_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const NOW = new Date('2024-01-01');
const PAST_DATE = new Date('2020-01-01');
const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);

const buildViewModel = (expiresAt: Date | null): QrViewModel =>
  new QrViewModel({
    id: QR_ID,
    spaceId: 'c3d4e5f6-a7b8-4012-cdef-123456789012',
    targetUrl: 'http://localhost:3000/plants/example?spaceId=abc',
    generation: 1,
    expiresAt,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('QrFindByIdQueryHandler', () => {
  let handler: QrFindByIdQueryHandler;
  let assertExists: jest.Mocked<AssertQrViewModelExistsService>;
  let assertNotExpired: jest.Mocked<AssertQrNotExpiredService>;

  beforeEach(() => {
    jest.clearAllMocks();

    assertExists = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertQrViewModelExistsService>;

    assertNotExpired = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertQrNotExpiredService>;

    handler = new QrFindByIdQueryHandler(assertExists, assertNotExpired);
  });

  it('returns the view model for a non-expired QR', async () => {
    const vm = buildViewModel(FUTURE_DATE);
    assertExists.execute.mockResolvedValue(vm);

    const result = await handler.execute(new QrFindByIdQuery({ qrId: QR_ID }));

    expect(result).toBe(vm);
  });

  it('returns the view model when expiresAt is null', async () => {
    const vm = buildViewModel(null);
    assertExists.execute.mockResolvedValue(vm);

    const result = await handler.execute(new QrFindByIdQuery({ qrId: QR_ID }));

    expect(result).toBe(vm);
  });

  it('propagates QrExpiredError from assertNotExpired', async () => {
    const vm = buildViewModel(PAST_DATE);
    assertExists.execute.mockResolvedValue(vm);
    assertNotExpired.execute.mockImplementation(() => {
      throw new QrExpiredError(QR_ID);
    });

    await expect(
      handler.execute(new QrFindByIdQuery({ qrId: QR_ID })),
    ).rejects.toThrow(QrExpiredError);
  });
});
