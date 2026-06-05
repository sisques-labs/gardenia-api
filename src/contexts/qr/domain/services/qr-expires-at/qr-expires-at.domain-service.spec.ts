import { QrExpiresAtInvalidError } from '@contexts/qr/domain/exceptions/qr-expires-at-invalid.error';
import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';

import { QrExpiresAtDomainService } from './qr-expires-at.domain-service';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);
const PAST_DATE = new Date('2020-01-01');

describe('QrExpiresAtDomainService', () => {
  let service: QrExpiresAtDomainService;

  beforeEach(() => {
    service = new QrExpiresAtDomainService();
  });

  describe('assertIsFuture()', () => {
    it('does not throw when expiresAt is null', () => {
      expect(() => service.assertIsFuture(null)).not.toThrow();
    });

    it('does not throw when expiresAt is in the future', () => {
      expect(() => service.assertIsFuture(FUTURE_DATE)).not.toThrow();
    });

    it('throws QrExpiresAtInvalidError when expiresAt is in the past', () => {
      expect(() => service.assertIsFuture(PAST_DATE)).toThrow(
        QrExpiresAtInvalidError,
      );
    });

    it('throws QrExpiresAtInvalidError when expiresAt equals now (boundary)', () => {
      expect(() => service.assertIsFuture(new Date())).toThrow(
        QrExpiresAtInvalidError,
      );
    });
  });

  describe('assertNotExpired()', () => {
    it('does not throw when expiresAt is null', () => {
      expect(() => service.assertNotExpired(QR_ID, null)).not.toThrow();
    });

    it('does not throw when expiresAt is in the future', () => {
      expect(() => service.assertNotExpired(QR_ID, FUTURE_DATE)).not.toThrow();
    });

    it('throws QrExpiredError when expiresAt is in the past', () => {
      expect(() => service.assertNotExpired(QR_ID, PAST_DATE)).toThrow(
        QrExpiredError,
      );
    });

    it('includes the qr id in the thrown error', () => {
      expect(() => service.assertNotExpired(QR_ID, PAST_DATE)).toThrow(QR_ID);
    });
  });
});
