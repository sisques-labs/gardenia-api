import { QrExpiresAtValueObject } from './qr-expires-at.value-object';

const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);
const PAST_DATE = new Date('2020-01-01');

describe('QrExpiresAtValueObject', () => {
  it('wraps a future date', () => {
    const vo = new QrExpiresAtValueObject(FUTURE_DATE);

    expect(vo.value).toBe(FUTURE_DATE);
  });

  it('wraps a past date (no validation — validation is a creation-time concern in QrExpiresAtDomainService)', () => {
    const vo = new QrExpiresAtValueObject(PAST_DATE);

    expect(vo.value).toBe(PAST_DATE);
  });
});
