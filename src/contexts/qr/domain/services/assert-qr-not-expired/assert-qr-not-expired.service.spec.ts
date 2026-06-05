import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';

import { AssertQrNotExpiredService } from './assert-qr-not-expired.service';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);
const PAST_DATE = new Date('2020-01-01');

describe('AssertQrNotExpiredService', () => {
  let service: AssertQrNotExpiredService;

  beforeEach(() => {
    service = new AssertQrNotExpiredService();
  });

  it('does not throw when expiresAt is null', async () => {
    await expect(
      service.execute({ id: QR_ID, expiresAt: null }),
    ).resolves.not.toThrow();
  });

  it('does not throw when expiresAt is in the future', async () => {
    await expect(
      service.execute({ id: QR_ID, expiresAt: FUTURE_DATE }),
    ).resolves.not.toThrow();
  });

  it('throws QrExpiredError when expiresAt is in the past', async () => {
    await expect(
      service.execute({ id: QR_ID, expiresAt: PAST_DATE }),
    ).rejects.toThrow(QrExpiredError);
  });

  it('includes the qr id in the thrown error', async () => {
    await expect(
      service.execute({ id: QR_ID, expiresAt: PAST_DATE }),
    ).rejects.toThrow(QR_ID);
  });
});
