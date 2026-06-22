import { InvitationDisplayCodeValueObject } from './invitation-display-code.value-object';

describe('InvitationDisplayCodeValueObject', () => {
  it('wraps a display code', () => {
    expect(new InvitationDisplayCodeValueObject('ABC-123').value).toBe(
      'ABC-123',
    );
  });

  it('supports equality comparison', () => {
    const a = new InvitationDisplayCodeValueObject('ABC-123');
    const b = new InvitationDisplayCodeValueObject('ABC-123');

    expect(a.equals(b)).toBe(true);
  });

  it('considers different codes unequal', () => {
    const a = new InvitationDisplayCodeValueObject('ABC-123');
    const b = new InvitationDisplayCodeValueObject('XYZ-789');

    expect(a.equals(b)).toBe(false);
  });
});
