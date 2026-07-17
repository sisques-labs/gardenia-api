import { DuplicateMembershipException } from '../exceptions/duplicate-membership.exception';
import { LastOwnerRemovalException } from '../exceptions/last-owner-removal.exception';
import { NotASpaceMemberException } from '../exceptions/not-a-space-member.exception';
import { MemberAddedEvent } from '../events/member-added/member-added.event';
import { MemberRemovedEvent } from '../events/member-removed/member-removed.event';
import { SpaceCreatedEvent } from '../events/space-created/space-created.event';
import { SpaceUpdatedEvent } from '../events/space-updated/space-updated.event';
import { SpaceNameChangedEvent } from '../events/field-changed/space-name-changed/space-name-changed.event';
import { SpaceLatitudeChangedEvent } from '../events/field-changed/space-latitude-changed/space-latitude-changed.event';
import { SpaceLongitudeChangedEvent } from '../events/field-changed/space-longitude-changed/space-longitude-changed.event';
import { SpaceEnvironmentChangedEvent } from '../events/field-changed/space-environment-changed/space-environment-changed.event';
import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { SpaceEnvironmentEnum } from '../enums/space-environment.enum';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';
import { SpaceLatitudeValueObject } from '../value-objects/space-latitude/space-latitude.value-object';
import { SpaceLongitudeValueObject } from '../value-objects/space-longitude/space-longitude.value-object';
import { SpaceEnvironmentValueObject } from '../value-objects/space-environment/space-environment.value-object';
import { SpaceBuilder } from '../builders/space.builder';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440002';
const ANOTHER_MEMBER_ID = '550e8400-e29b-41d4-a716-446655440003';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_NAME = 'Test Space';
const SPACE_LATITUDE = 40.4168;
const SPACE_LONGITUDE = -3.7038;
const SPACE_ENVIRONMENT = SpaceEnvironmentEnum.INDOOR;

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

function buildSpaceWithGeo() {
  return new SpaceBuilder()
    .withId(SPACE_ID)
    .withName(SPACE_NAME)
    .withOwnerId(OWNER_ID)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .withLatitude(SPACE_LATITUDE)
    .withLongitude(SPACE_LONGITUDE)
    .withEnvironment(SPACE_ENVIRONMENT)
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

    it('should default to MEMBER role when no role is provided', () => {
      const space = buildSpace();

      space.addMember(MEMBER_ID);

      const member = space.memberships.find((m) => m.userId === MEMBER_ID);
      expect(member).toBeDefined();
      expect(member!.role.value).toBe(MembershipRoleEnum.MEMBER);
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

  describe('update()', () => {
    it('should emit a SpaceUpdatedEvent when called with no props', () => {
      const space = buildSpace();
      space.commit();

      space.update({});
      const events = space.getUncommittedEvents();

      const event = events.find((e) => e instanceof SpaceUpdatedEvent);
      expect(event).toBeDefined();
    });

    it('should not emit any field-changed events when called with no props', () => {
      const space = buildSpace();
      space.commit();

      space.update({});
      const events = space.getUncommittedEvents();

      expect(
        events.find((e) => e instanceof SpaceNameChangedEvent),
      ).toBeUndefined();
      expect(
        events.find((e) => e instanceof SpaceLatitudeChangedEvent),
      ).toBeUndefined();
      expect(
        events.find((e) => e instanceof SpaceLongitudeChangedEvent),
      ).toBeUndefined();
      expect(
        events.find((e) => e instanceof SpaceEnvironmentChangedEvent),
      ).toBeUndefined();
    });

    describe('name', () => {
      it('should change the name and emit SpaceNameChangedEvent when the new name differs', () => {
        const space = buildSpace();
        space.commit();

        space.update({ name: new SpaceNameValueObject('New Space Name') });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceNameChangedEvent,
        ) as SpaceNameChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBe(SPACE_NAME);
        expect(event.data.newValue).toBe('New Space Name');
        expect(space.name.value).toBe('New Space Name');
      });

      it('should not emit SpaceNameChangedEvent when the name is unchanged', () => {
        const space = buildSpace();
        space.commit();

        space.update({ name: new SpaceNameValueObject(SPACE_NAME) });
        const events = space.getUncommittedEvents();

        expect(
          events.find((e) => e instanceof SpaceNameChangedEvent),
        ).toBeUndefined();
        expect(space.name.value).toBe(SPACE_NAME);
      });
    });

    describe('latitude', () => {
      it('should change the latitude and emit SpaceLatitudeChangedEvent when set from null to a value', () => {
        const space = buildSpace();
        space.commit();

        space.update({
          latitude: new SpaceLatitudeValueObject(SPACE_LATITUDE),
        });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceLatitudeChangedEvent,
        ) as SpaceLatitudeChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBeNull();
        expect(event.data.newValue).toBe(SPACE_LATITUDE);
        expect(space.latitude).toBe(SPACE_LATITUDE);
      });

      it('should change the latitude and emit SpaceLatitudeChangedEvent when it differs from the current value', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({ latitude: new SpaceLatitudeValueObject(10) });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceLatitudeChangedEvent,
        ) as SpaceLatitudeChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBe(SPACE_LATITUDE);
        expect(event.data.newValue).toBe(10);
        expect(space.latitude).toBe(10);
      });

      it('should not emit SpaceLatitudeChangedEvent when the latitude is unchanged', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({
          latitude: new SpaceLatitudeValueObject(SPACE_LATITUDE),
        });
        const events = space.getUncommittedEvents();

        expect(
          events.find((e) => e instanceof SpaceLatitudeChangedEvent),
        ).toBeUndefined();
        expect(space.latitude).toBe(SPACE_LATITUDE);
      });

      it('should change the latitude back to null and emit SpaceLatitudeChangedEvent when explicitly set to null', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({ latitude: null });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceLatitudeChangedEvent,
        ) as SpaceLatitudeChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBe(SPACE_LATITUDE);
        expect(event.data.newValue).toBeNull();
        expect(space.latitude).toBeNull();
      });
    });

    describe('longitude', () => {
      it('should change the longitude and emit SpaceLongitudeChangedEvent when set from null to a value', () => {
        const space = buildSpace();
        space.commit();

        space.update({
          longitude: new SpaceLongitudeValueObject(SPACE_LONGITUDE),
        });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceLongitudeChangedEvent,
        ) as SpaceLongitudeChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBeNull();
        expect(event.data.newValue).toBe(SPACE_LONGITUDE);
        expect(space.longitude).toBe(SPACE_LONGITUDE);
      });

      it('should change the longitude and emit SpaceLongitudeChangedEvent when it differs from the current value', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({ longitude: new SpaceLongitudeValueObject(20) });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceLongitudeChangedEvent,
        ) as SpaceLongitudeChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBe(SPACE_LONGITUDE);
        expect(event.data.newValue).toBe(20);
        expect(space.longitude).toBe(20);
      });

      it('should not emit SpaceLongitudeChangedEvent when the longitude is unchanged', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({
          longitude: new SpaceLongitudeValueObject(SPACE_LONGITUDE),
        });
        const events = space.getUncommittedEvents();

        expect(
          events.find((e) => e instanceof SpaceLongitudeChangedEvent),
        ).toBeUndefined();
        expect(space.longitude).toBe(SPACE_LONGITUDE);
      });

      it('should change the longitude back to null and emit SpaceLongitudeChangedEvent when explicitly set to null', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({ longitude: null });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceLongitudeChangedEvent,
        ) as SpaceLongitudeChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBe(SPACE_LONGITUDE);
        expect(event.data.newValue).toBeNull();
        expect(space.longitude).toBeNull();
      });
    });

    describe('environment', () => {
      it('should change the environment and emit SpaceEnvironmentChangedEvent when set from null to a value', () => {
        const space = buildSpace();
        space.commit();

        space.update({
          environment: new SpaceEnvironmentValueObject(SPACE_ENVIRONMENT),
        });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceEnvironmentChangedEvent,
        ) as SpaceEnvironmentChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBeNull();
        expect(event.data.newValue).toBe(SPACE_ENVIRONMENT);
        expect(space.environment).toBe(SPACE_ENVIRONMENT);
      });

      it('should change the environment and emit SpaceEnvironmentChangedEvent when it differs from the current value', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({
          environment: new SpaceEnvironmentValueObject(
            SpaceEnvironmentEnum.OUTDOOR,
          ),
        });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceEnvironmentChangedEvent,
        ) as SpaceEnvironmentChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBe(SPACE_ENVIRONMENT);
        expect(event.data.newValue).toBe(SpaceEnvironmentEnum.OUTDOOR);
        expect(space.environment).toBe(SpaceEnvironmentEnum.OUTDOOR);
      });

      it('should not emit SpaceEnvironmentChangedEvent when the environment is unchanged', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({
          environment: new SpaceEnvironmentValueObject(SPACE_ENVIRONMENT),
        });
        const events = space.getUncommittedEvents();

        expect(
          events.find((e) => e instanceof SpaceEnvironmentChangedEvent),
        ).toBeUndefined();
        expect(space.environment).toBe(SPACE_ENVIRONMENT);
      });

      it('should change the environment back to null and emit SpaceEnvironmentChangedEvent when explicitly set to null', () => {
        const space = buildSpaceWithGeo();
        space.commit();

        space.update({ environment: null });
        const events = space.getUncommittedEvents();

        const event = events.find(
          (e) => e instanceof SpaceEnvironmentChangedEvent,
        ) as SpaceEnvironmentChangedEvent;
        expect(event).toBeDefined();
        expect(event.data.oldValue).toBe(SPACE_ENVIRONMENT);
        expect(event.data.newValue).toBeNull();
        expect(space.environment).toBeNull();
      });
    });
  });
});
