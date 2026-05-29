import { SpaceAggregate } from './space.aggregate';
import { MembershipRole } from '../value-objects/membership-role/membership-role.vo';
import { DuplicateMembershipException } from '../exceptions/duplicate-membership.exception';
import { LastOwnerRemovalException } from '../exceptions/last-owner-removal.exception';
import { NotASpaceMemberException } from '../exceptions/not-a-space-member.exception';
import { SpaceCreatedEvent } from '../events/space-created/space-created.event';
import { MemberAddedEvent } from '../events/member-added/member-added.event';
import { MemberRemovedEvent } from '../events/member-removed/member-removed.event';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440002';
const ANOTHER_MEMBER_ID = '550e8400-e29b-41d4-a716-446655440003';
const SPACE_NAME = 'Test Space';

describe('SpaceAggregate', () => {
  describe('Space.create (static factory)', () => {
    it('should create a space with the given ownerId and name', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);

      expect(space.ownerId).toBe(OWNER_ID);
      expect(space.name.value).toBe(SPACE_NAME);
    });

    it('should generate a UUID id', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);

      expect(space.id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should add the owner as the first membership with OWNER role', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);

      expect(space.memberships).toHaveLength(1);
      expect(space.memberships[0].userId).toBe(OWNER_ID);
      expect(space.memberships[0].role.value).toBe(MembershipRole.OWNER);
    });

    it('should emit a SpaceCreatedEvent', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);
      const events = space.getUncommittedEvents();

      const createdEvent = events.find((e) => e instanceof SpaceCreatedEvent);
      expect(createdEvent).toBeDefined();
    });

    it('should emit a MemberAddedEvent for the owner', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);
      const events = space.getUncommittedEvents();

      const memberAddedEvent = events.find(
        (e) => e instanceof MemberAddedEvent,
      );
      expect(memberAddedEvent).toBeDefined();
    });
  });

  describe('addMember', () => {
    it('should add a new member with MEMBER role', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);
      space.commit(); // clear events from create()

      space.addMember(MEMBER_ID, MembershipRole.MEMBER);

      expect(space.memberships).toHaveLength(2);
      const member = space.memberships.find((m) => m.userId === MEMBER_ID);
      expect(member).toBeDefined();
      expect(member!.role.value).toBe(MembershipRole.MEMBER);
    });

    it('should emit a MemberAddedEvent', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);
      space.commit(); // clear events from create()

      space.addMember(MEMBER_ID, MembershipRole.MEMBER);
      const events = space.getUncommittedEvents();

      const event = events.find(
        (e) => e instanceof MemberAddedEvent,
      ) as MemberAddedEvent;
      expect(event).toBeDefined();
      expect(event.data.userId).toBe(MEMBER_ID);
    });

    it('should throw DuplicateMembershipException when user is already a member', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);

      expect(() => space.addMember(OWNER_ID, MembershipRole.MEMBER)).toThrow(
        DuplicateMembershipException,
      );
    });

    it('should throw DuplicateMembershipException when adding same member twice', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);
      space.addMember(MEMBER_ID, MembershipRole.MEMBER);

      expect(() => space.addMember(MEMBER_ID, MembershipRole.MEMBER)).toThrow(
        DuplicateMembershipException,
      );
    });
  });

  describe('removeMember', () => {
    it('should remove an existing member', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);
      space.addMember(MEMBER_ID, MembershipRole.MEMBER);
      space.getUncommittedEvents();

      space.removeMember(MEMBER_ID);

      expect(space.memberships).toHaveLength(1);
      expect(
        space.memberships.find((m) => m.userId === MEMBER_ID),
      ).toBeUndefined();
    });

    it('should emit a MemberRemovedEvent', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);
      space.addMember(MEMBER_ID, MembershipRole.MEMBER);
      space.commit(); // clear events from create() and addMember()

      space.removeMember(MEMBER_ID);
      const events = space.getUncommittedEvents();

      const event = events.find(
        (e) => e instanceof MemberRemovedEvent,
      ) as MemberRemovedEvent;
      expect(event).toBeDefined();
      expect(event.data.userId).toBe(MEMBER_ID);
    });

    it('should throw LastOwnerRemovalException when removing the last owner', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);

      expect(() => space.removeMember(OWNER_ID)).toThrow(
        LastOwnerRemovalException,
      );
    });

    it('should allow removing an owner when another owner exists', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);
      space.addMember(ANOTHER_MEMBER_ID, MembershipRole.OWNER);

      expect(() => space.removeMember(OWNER_ID)).not.toThrow();
    });

    it('should throw NotASpaceMemberException when user is not a member', () => {
      const space = SpaceAggregate.create(OWNER_ID, SPACE_NAME);

      expect(() => space.removeMember(MEMBER_ID)).toThrow(
        NotASpaceMemberException,
      );
    });
  });
});
