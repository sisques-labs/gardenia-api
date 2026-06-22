import { SpaceInvitationIdValueObject } from './space-invitation-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('SpaceInvitationIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new SpaceInvitationIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new SpaceInvitationIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new SpaceInvitationIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new SpaceInvitationIdValueObject(VALID_UUID);
    const b = new SpaceInvitationIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});
