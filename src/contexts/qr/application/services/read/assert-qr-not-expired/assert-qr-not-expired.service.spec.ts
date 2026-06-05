import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';
import { AssertQrNotExpiredDomainService } from '@contexts/qr/domain/services/assert-qr-not-expired/assert-qr-not-expired.domain-service';
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
  let domainService: jest.Mocked<AssertQrNotExpiredDomainService>;

  beforeEach(() => {
    domainService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<AssertQrNotExpiredDomainService>;

    service = new AssertQrNotExpiredService(domainService);
  });

  it('does not throw when expiresAt is null', async () => {
    const vm = buildViewModel(null);

    await expect(service.execute(vm)).resolves.not.toThrow();
    expect(domainService.execute).toHaveBeenCalledWith({
      id: QR_ID,
      expiresAt: null,
    });
  });

  it('does not throw when expiresAt is in the future', async () => {
    const vm = buildViewModel(FUTURE_DATE);

    await expect(service.execute(vm)).resolves.not.toThrow();
    expect(domainService.execute).toHaveBeenCalledWith({
      id: QR_ID,
      expiresAt: FUTURE_DATE,
    });
  });

  it('propagates QrExpiredError from the domain service when expiresAt is in the past', async () => {
    const vm = buildViewModel(PAST_DATE);
    domainService.execute.mockRejectedValue(new QrExpiredError(QR_ID));

    await expect(service.execute(vm)).rejects.toThrow(QrExpiredError);
  });

  it('includes the qr id in the thrown error', async () => {
    const vm = buildViewModel(PAST_DATE);
    domainService.execute.mockRejectedValue(new QrExpiredError(QR_ID));

    await expect(service.execute(vm)).rejects.toThrow(QR_ID);
  });
});
