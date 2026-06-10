import { InvitationCodeValueObject } from './invitation-code.value-object';

describe('InvitationCodeValueObject', () => {
  it('normalizes display input to uppercase alphanumeric', () => {
    const vo = new InvitationCodeValueObject('lim · 2026 · k0');
    expect(vo.value).toBe('LIM2026K0');
  });

  it('normalize static strips separators', () => {
    expect(InvitationCodeValueObject.normalize('LIM · 2026 · K0')).toBe(
      'LIM2026K0',
    );
  });
});
