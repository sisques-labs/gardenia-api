import { QrExpiresAtInvalidError } from '@contexts/qr/domain/exceptions/qr-expires-at-invalid.error';

import { AssertQrExpiresAtIsFutureService } from './assert-qr-expires-at-is-future.service';

const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);
const PAST_DATE = new Date('2020-01-01');

describe('AssertQrExpiresAtIsFutureService', () => {
  let service: AssertQrExpiresAtIsFutureService;

  beforeEach(() => {
    service = new AssertQrExpiresAtIsFutureService();
  });

  it('does not throw when expiresAt is null', async () => {
    await expect(service.execute(null)).resolves.not.toThrow();
  });

  it('does not throw when expiresAt is in the future', async () => {
    await expect(service.execute(FUTURE_DATE)).resolves.not.toThrow();
  });

  it('throws QrExpiresAtInvalidError when expiresAt is in the past', async () => {
    await expect(service.execute(PAST_DATE)).rejects.toThrow(
      QrExpiresAtInvalidError,
    );
  });

  it('throws QrExpiresAtInvalidError when expiresAt equals now (boundary)', async () => {
    await expect(service.execute(new Date())).rejects.toThrow(
      QrExpiresAtInvalidError,
    );
  });
});
