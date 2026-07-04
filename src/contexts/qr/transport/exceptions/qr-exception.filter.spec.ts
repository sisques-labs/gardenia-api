import { HttpStatus } from '@nestjs/common';

import { QrExpiresAtInvalidError } from '@contexts/qr/domain/exceptions/qr-expires-at-invalid.error';
import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';
import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import { resolveQrExceptionStatus } from './qr-exception.filter';

class UnknownException extends Error {}

describe('resolveQrExceptionStatus', () => {
  it('maps QrNotFoundException to 404', () => {
    expect(
      resolveQrExceptionStatus(new QrNotFoundException('some-id') as any),
    ).toBe(HttpStatus.NOT_FOUND);
  });

  it('maps QrExpiredError to 410', () => {
    expect(resolveQrExceptionStatus(new QrExpiredError('some-id') as any)).toBe(
      HttpStatus.GONE,
    );
  });

  it('maps QrExpiresAtInvalidError to 400', () => {
    expect(resolveQrExceptionStatus(new QrExpiresAtInvalidError() as any)).toBe(
      HttpStatus.BAD_REQUEST,
    );
  });

  it('returns null for an unmapped exception', () => {
    expect(
      resolveQrExceptionStatus(new UnknownException('boom') as any),
    ).toBeNull();
  });
});
