import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';
import { QrExpiresAtDomainService } from '@contexts/qr/domain/services/qr-expires-at/qr-expires-at.domain-service';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

import { AssertQrNotExpiredService } from './assert-qr-not-expired.service';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01');
const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);
const PAST_DATE = new Date('2020-01-01');

const buildViewModel = (expiresAt: Date | null): QrViewModel =>
  new QrViewModel({
    id: QR_ID,
    spaceId: '550e8400-e29b-41d4-a716-446655440002',
    targetUrl: 'http://localhost:3000/plants/example?spaceId=abc',
    generation: 1,
    expiresAt,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('AssertQrNotExpiredService', () => {
  let service: AssertQrNotExpiredService;
  let qrExpiresAtDomainService: jest.Mocked<QrExpiresAtDomainService>;

  beforeEach(() => {
    qrExpiresAtDomainService = {
      assertIsFuture: jest.fn(),
      assertNotExpired: jest.fn(),
    } as jest.Mocked<QrExpiresAtDomainService>;

    service = new AssertQrNotExpiredService(qrExpiresAtDomainService);
  });

  it('does not throw when expiresAt is null', () => {
    const vm = buildViewModel(null);

    expect(() => service.execute(vm)).not.toThrow();
    expect(qrExpiresAtDomainService.assertNotExpired).toHaveBeenCalledWith(
      QR_ID,
      null,
    );
  });

  it('does not throw when expiresAt is in the future', () => {
    const vm = buildViewModel(FUTURE_DATE);

    expect(() => service.execute(vm)).not.toThrow();
    expect(qrExpiresAtDomainService.assertNotExpired).toHaveBeenCalledWith(
      QR_ID,
      FUTURE_DATE,
    );
  });

  it('propagates QrExpiredError from the domain service when expiresAt is in the past', () => {
    const vm = buildViewModel(PAST_DATE);
    qrExpiresAtDomainService.assertNotExpired.mockImplementation(() => {
      throw new QrExpiredError(QR_ID);
    });

    expect(() => service.execute(vm)).toThrow(QrExpiredError);
  });

  it('includes the qr id in the thrown error', () => {
    const vm = buildViewModel(PAST_DATE);
    qrExpiresAtDomainService.assertNotExpired.mockImplementation(() => {
      throw new QrExpiredError(QR_ID);
    });

    expect(() => service.execute(vm)).toThrow(QR_ID);
  });
});
