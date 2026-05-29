import { DuplicateMembershipException } from '../exceptions/duplicate-membership.exception';
import { LastOwnerRemovalException } from '../exceptions/last-owner-removal.exception';
import { NotASpaceMemberException } from '../exceptions/not-a-space-member.exception';
import { MemberAddedEvent } from '../events/member-added/member-added.event';
import { MemberRemovedEvent } from '../events/member-removed/member-removed.event';
import { SpaceCreatedEvent } from '../events/space-created/space-created.event';
import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { SpaceBuilder } from '../builders/space.builder';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440002';
const ANOTHER_MEMBER_ID = '550e8400-e29b-41d4-a716-446655440003';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_NAME = 'Test Space';

const NOW = new Date('2024-01-01T00:00:00.000Z');

function buildSpace(name = SPACE_NAME) {
  return new SpaceBuilder()
    .withId(SPACE_ID)
    .withName(name)
    .withOwnerId(OWNER_ID)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('SpaceAggregate', () => {
  describe('create() — instance method', () => {
    it('should emit a SpaceCreatedEvent', () => {
      const space = buildSpace();
      space.create();
      const events = space.getUncommittedEvents();

      const createdEvent = events.find((e) => e instanceof SpaceCreatedEvent);
      expect(createdEvent).toBeDefined();
    });

    it('should include primitives in the SpaceCreatedEvent data', () => {
      const space = buildSpace();
      space.create();
      const events = space.getUncommittedEvents();

      const event = events.find(
        (e) => e instanceof SpaceCreatedEvent,
      ) as SpaceCreatedEvent;
      expect(event.data.name).toBe(SPACE_NAME);
      expect(event.data.ownerId).toBe(OWNER_ID);
    });

    it('should have correct id and name after construction', () => {
      const space = buildSpace();

      expect(space.id.value).toBe(SPACE_ID);
      expect(space.name.value).toBe(SPACE_NAME);
      expect(space.ownerId).toBe(OWNER_ID);
    });
  });

  describe('addMember', () => {
    it('should add a new member with MEMBER role', () => {
      const space = buildSpace();

      space.addMember(MEMBER_ID, MembershipRoleEnum.MEMBER);

      expect(space.memberships).toHaveLength(1);
      const member = space.memberships.find((m) => m.userId === MEMBER_ID);
      expect(member).toBeDefined();
      expect(member!.role.value).toBe(MembershipRoleEnum.MEMBER);
    });

    it('should emit a MemberAddedEvent', () => {
      const space = buildSpace();

      space.addMember(MEMBER_ID, MembershipRoleEnum.MEMBER);
      const events = space.getUncommittedEvents();

      const event = events.find(
        (e) => e instanceof MemberAddedEvent,
      ) as MemberAddedEvent;
      expect(event).toBeDefined();
      expect(event.data.userId).toBe(MEMBER_ID);
    });

    it('should throw DuplicateMembershipException when adding same member twice', () => {
      const space = buildSpace();
      space.addMember(MEMBER_ID, MembershipRoleEnum.MEMBER);

      expect(() =>
        space.addMember(MEMBER_ID, MembershipRoleEnum.MEMBER),
      ).toThrow(DuplicateMembershipException);
    });
  });

  describe('removeMember', () => {
    it('should remove an existing member', () => {
      const space = buildSpace();
      space.addMember(OWNER_ID, MembershipRoleEnum.OWNER);
      space.addMember(MEMBER_ID, MembershipRoleEnum.MEMBER);

      space.removeMember(MEMBER_ID);

      expect(
        space.memberships.find((m) => m.userId === MEMBER_ID),
      ).toBeUndefined();
    });

    it('should emit a MemberRemovedEvent', () => {
      const space = buildSpace();
      space.addMember(OWNER_ID, MembershipRoleEnum.OWNER);
      space.addMember(MEMBER_ID, MembershipRoleEnum.MEMBER);
      space.commit();

      space.removeMember(MEMBER_ID);
      const events = space.getUncommittedEvents();

      const event = events.find(
        (e) => e instanceof MemberRemovedEvent,
      ) as MemberRemovedEvent;
      expect(event).toBeDefined();
      expect(event.data.userId).toBe(MEMBER_ID);
    });

    it('should throw LastOwnerRemovalException when removing the last owner', () => {
      const space = buildSpace();
      space.addMember(OWNER_ID, MembershipRoleEnum.OWNER);

      expect(() => space.removeMember(OWNER_ID)).toThrow(
        LastOwnerRemovalException,
      );
    });

    it('should allow removing an owner when another owner exists', () => {
      const space = buildSpace();
      space.addMember(OWNER_ID, MembershipRoleEnum.OWNER);
      space.addMember(ANOTHER_MEMBER_ID, MembershipRoleEnum.OWNER);

      expect(() => space.removeMember(OWNER_ID)).not.toThrow();
    });

    it('should throw NotASpaceMemberException when user is not a member', () => {
      const space = buildSpace();

      expect(() => space.removeMember(MEMBER_ID)).toThrow(
        NotASpaceMemberException,
      );
    });
  });
});
