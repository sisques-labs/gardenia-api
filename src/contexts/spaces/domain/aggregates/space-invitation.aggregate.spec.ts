import { SpaceInvitationBuilder } from '../builders/space-invitation.builder';
import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { SpaceInvitationCreatedEvent } from '../events/space-invitation-created/space-invitation-created.event';

const NOW = new Date('2026-06-09T12:00:00.000Z');
const EXPIRES = new Date('2099-01-01T12:00:00.000Z');

describe('SpaceInvitationAggregate', () => {
  function buildInvitation() {
    return new SpaceInvitationBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withSpaceId('550e8400-e29b-41d4-a716-446655440001')
      .withCreatedByUserId('550e8400-e29b-41d4-a716-446655440002')
      .withRole(MembershipRoleEnum.MEMBER)
      .withCode('LIM2026K0')
      .withDisplayCode('LIM · 2026 · K0')
      .withQrId('550e8400-e29b-41d4-a716-446655440003')
      .withExpiresAt(EXPIRES)
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();
  }

  it('create() emits SpaceInvitationCreatedEvent', () => {
    const invitation = buildInvitation();
    invitation.create();

    const events = invitation.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SpaceInvitationCreatedEvent);
  });

  it('isExpired() returns false before expiresAt', () => {
    const invitation = buildInvitation();
    expect(invitation.isExpired()).toBe(false);
  });

  it('isExpired() returns true after expiresAt', () => {
    const invitation = new SpaceInvitationBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withSpaceId('550e8400-e29b-41d4-a716-446655440001')
      .withCreatedByUserId('550e8400-e29b-41d4-a716-446655440002')
      .withCode('LIM2026K0')
      .withDisplayCode('LIM · 2026 · K0')
      .withExpiresAt(new Date('2020-01-01T00:00:00.000Z'))
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();

    expect(invitation.isExpired()).toBe(true);
  });

  it('toPrimitives() returns null qrId when no qrId was set', () => {
    const invitation = new SpaceInvitationBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withSpaceId('550e8400-e29b-41d4-a716-446655440001')
      .withCreatedByUserId('550e8400-e29b-41d4-a716-446655440002')
      .withRole(MembershipRoleEnum.MEMBER)
      .withCode('LIM2026K0')
      .withDisplayCode('LIM · 2026 · K0')
      .withExpiresAt(EXPIRES)
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();

    expect(invitation.qrId).toBeNull();
    expect(invitation.toPrimitives().qrId).toBeNull();
  });

  it('exposes its fields via getters', () => {
    const invitation = buildInvitation();

    expect(invitation.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(invitation.spaceId.value).toBe(
      '550e8400-e29b-41d4-a716-446655440001',
    );
    expect(invitation.createdByUserId.value).toBe(
      '550e8400-e29b-41d4-a716-446655440002',
    );
    expect(invitation.role.value).toBe(MembershipRoleEnum.MEMBER);
    expect(invitation.code.value).toBe('LIM2026K0');
    expect(invitation.displayCode.value).toBe('LIM · 2026 · K0');
    expect(invitation.qrId?.value).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(invitation.expiresAt.value).toEqual(EXPIRES);
  });
});
