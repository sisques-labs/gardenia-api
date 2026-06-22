import { InvitationExpiresAtValueObject } from './invitation-expires-at.value-object';

describe('InvitationExpiresAtValueObject', () => {
  it('wraps a date value', () => {
    const date = new Date('2026-12-31T23:59:59.000Z');

    expect(new InvitationExpiresAtValueObject(date).value).toBe(date);
  });

  it('supports equality by timestamp', () => {
    const a = new InvitationExpiresAtValueObject(new Date('2026-12-31'));
    const b = new InvitationExpiresAtValueObject(new Date('2026-12-31'));

    expect(a.equals(b)).toBe(true);
  });
});
