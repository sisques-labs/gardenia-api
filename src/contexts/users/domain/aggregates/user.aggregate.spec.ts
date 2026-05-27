import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserCreatedEvent } from '@contexts/users/domain/events/user-created/user-created.event';
import { UserDeletedEvent } from '@contexts/users/domain/events/user-deleted/user-deleted.event';
import { UserStatusChangedEvent } from '@contexts/users/domain/events/field-changed/user-status-changed/user-status-changed.event';
import { UserUpdatedEvent } from '@contexts/users/domain/events/user-updated/user-updated.event';
import { UserFirstNameChangedEvent } from '@contexts/users/domain/events/field-changed/user-first-name-changed/user-first-name-changed.event';
import { UserLastNameChangedEvent } from '@contexts/users/domain/events/field-changed/user-last-name-changed/user-last-name-changed.event';
import { UserAvatarUrlChangedEvent } from '@contexts/users/domain/events/field-changed/user-avatar-url-changed/user-avatar-url-changed.event';
import { UserBioChangedEvent } from '@contexts/users/domain/events/field-changed/user-bio-changed/user-bio-changed.event';
import { UserLocaleChangedEvent } from '@contexts/users/domain/events/field-changed/user-locale-changed/user-locale-changed.event';
import { UserTimezoneChangedEvent } from '@contexts/users/domain/events/field-changed/user-timezone-changed/user-timezone-changed.event';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserUsernameChangedEvent } from '@contexts/users/domain/events/field-changed/user-username-changed/user-username-changed.event';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
import { UsernameValueObject } from '@contexts/users/domain/value-objects/username/username.value-object';
import { UserAggregate } from './user.aggregate';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

const buildUser = (
  status: UserStatusEnum = UserStatusEnum.ACTIVE,
): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(status)
    .withUsername('johndoe')
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT)
    .build();

const buildFullUser = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withUsername('johndoe')
    .withFirstName('John')
    .withLastName('Doe')
    .withAvatarUrl('https://example.com/avatar.png')
    .withBio('A short bio.')
    .withLocale('es-AR')
    .withTimezone('America/Buenos_Aires')
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT)
    .build();

describe('UserAggregate', () => {
  describe('create() — static factory via constructor', () => {
    it('should construct an aggregate with matching field values', () => {
      const user = buildUser();

      expect(user.id.value).toBe(USER_ID);
      expect(user.status.value).toBe(UserStatusEnum.ACTIVE);
      expect(user.createdAt.value).toEqual(CREATED_AT);
      expect(user.updatedAt.value).toEqual(UPDATED_AT);
    });

    it('should emit a UserCreatedEvent on construction', () => {
      const user = buildUser();
      const events = user.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
    });

    it('should emit a UserCreatedEvent with correct aggregate metadata', () => {
      const user = buildUser();
      const event = user.getUncommittedEvents()[0] as UserCreatedEvent;

      expect(event.aggregateRootId).toBe(USER_ID);
      expect(event.aggregateRootType).toBe(UserAggregate.name);
    });

    it('should include correct primitives in the UserCreatedEvent data', () => {
      const user = buildUser();
      const event = user.getUncommittedEvents()[0] as UserCreatedEvent;

      expect(event.data.id).toBe(USER_ID);
      expect(event.data.status).toBe(UserStatusEnum.ACTIVE);
      expect(event.data.username).toBe('johndoe');
    });

    it('should initialize all nullable profile fields to null when not provided', () => {
      const user = buildUser();

      expect(user.firstName).toBeNull();
      expect(user.lastName).toBeNull();
      expect(user.avatarUrl).toBeNull();
      expect(user.bio).toBeNull();
      expect(user.locale).toBeNull();
      expect(user.timezone).toBeNull();
    });

    it('should construct with all profile fields set when provided', () => {
      const user = buildFullUser();

      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.avatarUrl).toBe('https://example.com/avatar.png');
      expect(user.bio).toBe('A short bio.');
      expect(user.locale).toBe('es-AR');
      expect(user.timezone).toBe('America/Buenos_Aires');
    });
  });

  describe('activate()', () => {
    it('should set status to ACTIVE', () => {
      const user = buildUser(UserStatusEnum.INACTIVE);
      user.activate();

      expect(user.status.value).toBe(UserStatusEnum.ACTIVE);
    });

    it('should emit a UserStatusChangedEvent', () => {
      const user = buildUser(UserStatusEnum.INACTIVE);
      user.activate();

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(
        (e) => e instanceof UserStatusChangedEvent,
      );

      expect(statusEvent).toBeDefined();
      expect(statusEvent).toBeInstanceOf(UserStatusChangedEvent);
    });

    it('should record the old and new status in the event data', () => {
      const user = buildUser(UserStatusEnum.INACTIVE);
      user.activate();

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(
        (e) => e instanceof UserStatusChangedEvent,
      ) as UserStatusChangedEvent;

      expect(statusEvent.data.oldValue).toBe(UserStatusEnum.INACTIVE);
      expect(statusEvent.data.newValue).toBe(UserStatusEnum.ACTIVE);
    });
  });

  describe('deactivate()', () => {
    it('should set status to INACTIVE', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.deactivate();

      expect(user.status.value).toBe(UserStatusEnum.INACTIVE);
    });

    it('should emit a UserStatusChangedEvent', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.deactivate();

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(
        (e) => e instanceof UserStatusChangedEvent,
      );

      expect(statusEvent).toBeInstanceOf(UserStatusChangedEvent);
    });

    it('should record old status ACTIVE and new status INACTIVE', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.deactivate();

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(
        (e) => e instanceof UserStatusChangedEvent,
      ) as UserStatusChangedEvent;

      expect(statusEvent.data.oldValue).toBe(UserStatusEnum.ACTIVE);
      expect(statusEvent.data.newValue).toBe(UserStatusEnum.INACTIVE);
    });
  });

  describe('block()', () => {
    it('should set status to BLOCKED', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.block();

      expect(user.status.value).toBe(UserStatusEnum.BLOCKED);
    });

    it('should emit a UserStatusChangedEvent', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.block();

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(
        (e) => e instanceof UserStatusChangedEvent,
      );

      expect(statusEvent).toBeInstanceOf(UserStatusChangedEvent);
    });
  });

  describe('delete()', () => {
    it('should emit a UserDeletedEvent', () => {
      const user = buildUser();
      user.delete();

      const events = user.getUncommittedEvents();
      const deletedEvent = events.find((e) => e instanceof UserDeletedEvent);

      expect(deletedEvent).toBeInstanceOf(UserDeletedEvent);
    });

    it('should emit UserDeletedEvent with correct metadata', () => {
      const user = buildUser();
      user.delete();

      const events = user.getUncommittedEvents();
      const deletedEvent = events.find(
        (e) => e instanceof UserDeletedEvent,
      ) as UserDeletedEvent;

      expect(deletedEvent.aggregateRootId).toBe(USER_ID);
      expect(deletedEvent.entityType).toBe(UserAggregate.name);
    });

    it('should include primitives in the UserDeletedEvent data', () => {
      const user = buildUser();
      user.delete();

      const events = user.getUncommittedEvents();
      const deletedEvent = events.find(
        (e) => e instanceof UserDeletedEvent,
      ) as UserDeletedEvent;

      expect(deletedEvent.data.id).toBe(USER_ID);
    });
  });

  describe('changeStatus()', () => {
    it('should update the status VO', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.changeStatus(UserStatusEnum.BLOCKED);

      expect(user.status.value).toBe(UserStatusEnum.BLOCKED);
    });

    it('should emit a UserStatusChangedEvent with correct old and new values', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.changeStatus(UserStatusEnum.BLOCKED);

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(
        (e) => e instanceof UserStatusChangedEvent,
      ) as UserStatusChangedEvent;

      expect(statusEvent).toBeDefined();
      expect(statusEvent.data.oldValue).toBe(UserStatusEnum.ACTIVE);
      expect(statusEvent.data.newValue).toBe(UserStatusEnum.BLOCKED);
    });
  });

  describe('update()', () => {
    it('should emit a UserUpdatedEvent', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.update({});

      const events = user.getUncommittedEvents();
      const updatedEvent = events.find((e) => e instanceof UserUpdatedEvent);

      expect(updatedEvent).toBeInstanceOf(UserUpdatedEvent);
    });

    it('should emit a UserStatusChangedEvent when status is provided', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.update({
        status: new UserStatusValueObject(UserStatusEnum.INACTIVE),
      });

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(
        (e) => e instanceof UserStatusChangedEvent,
      );

      expect(statusEvent).toBeInstanceOf(UserStatusChangedEvent);
    });

    it('should NOT emit a UserStatusChangedEvent when status is not provided', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.update({});

      const events = user.getUncommittedEvents();
      const statusEvents = events.filter(
        (e) => e instanceof UserStatusChangedEvent,
      );

      expect(statusEvents).toHaveLength(0);
    });

    it('should update the status when provided', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.update({
        status: new UserStatusValueObject(UserStatusEnum.INACTIVE),
      });

      expect(user.status.value).toBe(UserStatusEnum.INACTIVE);
    });
  });

  describe('toPrimitives() — round-trip', () => {
    it('should return primitives matching the constructed values', () => {
      const user = buildUser();
      const primitives = user.toPrimitives();

      expect(primitives.id).toBe(USER_ID);
      expect(primitives.status).toBe(UserStatusEnum.ACTIVE);
      expect(primitives.username).toBe('johndoe');
      expect(primitives.createdAt).toEqual(CREATED_AT);
      expect(primitives.updatedAt).toEqual(UPDATED_AT);
    });

    it('should return null for all nullable fields when not set', () => {
      const user = buildUser();
      const primitives = user.toPrimitives();

      expect(primitives.firstName).toBeNull();
      expect(primitives.lastName).toBeNull();
      expect(primitives.avatarUrl).toBeNull();
      expect(primitives.bio).toBeNull();
      expect(primitives.locale).toBeNull();
      expect(primitives.timezone).toBeNull();
    });

    it('should return all profile field values when set', () => {
      const user = buildFullUser();
      const primitives = user.toPrimitives();

      expect(primitives.firstName).toBe('John');
      expect(primitives.lastName).toBe('Doe');
      expect(primitives.avatarUrl).toBe('https://example.com/avatar.png');
      expect(primitives.bio).toBe('A short bio.');
      expect(primitives.locale).toBe('es-AR');
      expect(primitives.timezone).toBe('America/Buenos_Aires');
    });

    it('should reconstruct an equivalent aggregate from toPrimitives() output', () => {
      const original = buildFullUser();
      const primitives = original.toPrimitives();

      const reconstructed = new UserBuilder()
        .withId(primitives.id)
        .withStatus(primitives.status)
        .withUsername(primitives.username)
        .withFirstName(primitives.firstName)
        .withLastName(primitives.lastName)
        .withAvatarUrl(primitives.avatarUrl)
        .withBio(primitives.bio)
        .withLocale(primitives.locale)
        .withTimezone(primitives.timezone)
        .withCreatedAt(primitives.createdAt)
        .withUpdatedAt(primitives.updatedAt)
        .build();

      expect(reconstructed.id.value).toBe(original.id.value);
      expect(reconstructed.status.value).toBe(original.status.value);
      expect(reconstructed.username.value).toBe(original.username.value);
      expect(reconstructed.firstName).toBe(original.firstName);
      expect(reconstructed.lastName).toBe(original.lastName);
      expect(reconstructed.avatarUrl).toBe(original.avatarUrl);
      expect(reconstructed.bio).toBe(original.bio);
      expect(reconstructed.locale).toBe(original.locale);
      expect(reconstructed.timezone).toBe(original.timezone);
      expect(reconstructed.createdAt.value).toEqual(original.createdAt.value);
      expect(reconstructed.updatedAt.value).toEqual(original.updatedAt.value);
    });
  });

  describe('field accessors', () => {
    it('should expose id as a UserIdValueObject', () => {
      const user = buildUser();

      expect(user.id).toBeDefined();
      expect(user.id.value).toBe(USER_ID);
    });

    it('should expose status as a UserStatusValueObject', () => {
      const user = buildUser();

      expect(user.status).toBeDefined();
      expect(user.status.value).toBe(UserStatusEnum.ACTIVE);
    });

    it('should expose username as a UsernameValueObject', () => {
      const user = buildUser();

      expect(user.username).toBeDefined();
      expect(user.username.value).toBe('johndoe');
    });

    it('should expose createdAt from BaseAggregate', () => {
      const user = buildUser();

      expect(user.createdAt.value).toEqual(CREATED_AT);
    });

    it('should expose updatedAt from BaseAggregate', () => {
      const user = buildUser();

      expect(user.updatedAt.value).toEqual(UPDATED_AT);
    });
  });

  describe('username — changeUsername via update()', () => {
    it('should update the username when a different value is provided via update()', () => {
      const user = buildUser();
      user.update({ username: new UsernameValueObject('newusername') });

      expect(user.username.value).toBe('newusername');
    });

    it('should emit a UserUsernameChangedEvent when username changes', () => {
      const user = buildUser();
      user.update({ username: new UsernameValueObject('newusername') });

      const events = user.getUncommittedEvents();
      const usernameChangedEvent = events.find(
        (e) => e instanceof UserUsernameChangedEvent,
      );

      expect(usernameChangedEvent).toBeDefined();
      expect(usernameChangedEvent).toBeInstanceOf(UserUsernameChangedEvent);
    });

    it('should emit UserUsernameChangedEvent with old and new values', () => {
      const user = buildUser();
      user.update({ username: new UsernameValueObject('newusername') });

      const events = user.getUncommittedEvents();
      const usernameChangedEvent = events.find(
        (e) => e instanceof UserUsernameChangedEvent,
      ) as any;

      expect(usernameChangedEvent.data.oldValue).toBe('johndoe');
      expect(usernameChangedEvent.data.newValue).toBe('newusername');
    });

    it('should NOT emit UserUsernameChangedEvent when username is unchanged', () => {
      const user = buildUser();
      user.update({ username: new UsernameValueObject('johndoe') });

      const events = user.getUncommittedEvents();
      const usernameChangedEvents = events.filter(
        (e) => e instanceof UserUsernameChangedEvent,
      );

      expect(usernameChangedEvents).toHaveLength(0);
    });
  });

  describe('profile fields — change via update()', () => {
    describe('firstName', () => {
      it('should update firstName when a different value is provided', () => {
        const user = buildUser();
        user.update({ firstName: 'Jane' });

        expect(user.firstName).toBe('Jane');
      });

      it('should set firstName to null when null is provided', () => {
        const user = buildFullUser();
        user.update({ firstName: null });

        expect(user.firstName).toBeNull();
      });

      it('should emit UserFirstNameChangedEvent when firstName changes', () => {
        const user = buildUser();
        user.update({ firstName: 'Jane' });

        const events = user.getUncommittedEvents();
        const event = events.find(
          (e) => e instanceof UserFirstNameChangedEvent,
        );

        expect(event).toBeInstanceOf(UserFirstNameChangedEvent);
      });

      it('should emit UserFirstNameChangedEvent with old and new values', () => {
        const user = buildFullUser();
        user.update({ firstName: 'Jane' });

        const events = user.getUncommittedEvents();
        const event = events.find(
          (e) => e instanceof UserFirstNameChangedEvent,
        ) as UserFirstNameChangedEvent;

        expect(event.data.oldValue).toBe('John');
        expect(event.data.newValue).toBe('Jane');
      });

      it('should NOT emit UserFirstNameChangedEvent when firstName is unchanged', () => {
        const user = buildFullUser();
        user.update({ firstName: 'John' });

        const events = user.getUncommittedEvents();
        const changedEvents = events.filter(
          (e) => e instanceof UserFirstNameChangedEvent,
        );

        expect(changedEvents).toHaveLength(0);
      });
    });

    describe('lastName', () => {
      it('should update lastName when a different value is provided', () => {
        const user = buildUser();
        user.update({ lastName: 'Smith' });

        expect(user.lastName).toBe('Smith');
      });

      it('should emit UserLastNameChangedEvent when lastName changes', () => {
        const user = buildUser();
        user.update({ lastName: 'Smith' });

        const events = user.getUncommittedEvents();
        const event = events.find((e) => e instanceof UserLastNameChangedEvent);

        expect(event).toBeInstanceOf(UserLastNameChangedEvent);
      });

      it('should NOT emit UserLastNameChangedEvent when lastName is unchanged', () => {
        const user = buildFullUser();
        user.update({ lastName: 'Doe' });

        const events = user.getUncommittedEvents();
        const changedEvents = events.filter(
          (e) => e instanceof UserLastNameChangedEvent,
        );

        expect(changedEvents).toHaveLength(0);
      });
    });

    describe('avatarUrl', () => {
      it('should update avatarUrl when a different value is provided', () => {
        const user = buildUser();
        user.update({ avatarUrl: 'https://new.example.com/avatar.png' });

        expect(user.avatarUrl).toBe('https://new.example.com/avatar.png');
      });

      it('should emit UserAvatarUrlChangedEvent when avatarUrl changes', () => {
        const user = buildUser();
        user.update({ avatarUrl: 'https://new.example.com/avatar.png' });

        const events = user.getUncommittedEvents();
        const event = events.find(
          (e) => e instanceof UserAvatarUrlChangedEvent,
        );

        expect(event).toBeInstanceOf(UserAvatarUrlChangedEvent);
      });

      it('should NOT emit UserAvatarUrlChangedEvent when avatarUrl is unchanged', () => {
        const user = buildFullUser();
        user.update({ avatarUrl: 'https://example.com/avatar.png' });

        const events = user.getUncommittedEvents();
        const changedEvents = events.filter(
          (e) => e instanceof UserAvatarUrlChangedEvent,
        );

        expect(changedEvents).toHaveLength(0);
      });
    });

    describe('bio', () => {
      it('should update bio when a different value is provided', () => {
        const user = buildUser();
        user.update({ bio: 'My new bio.' });

        expect(user.bio).toBe('My new bio.');
      });

      it('should emit UserBioChangedEvent when bio changes', () => {
        const user = buildUser();
        user.update({ bio: 'My new bio.' });

        const events = user.getUncommittedEvents();
        const event = events.find((e) => e instanceof UserBioChangedEvent);

        expect(event).toBeInstanceOf(UserBioChangedEvent);
      });

      it('should NOT emit UserBioChangedEvent when bio is unchanged', () => {
        const user = buildFullUser();
        user.update({ bio: 'A short bio.' });

        const events = user.getUncommittedEvents();
        const changedEvents = events.filter(
          (e) => e instanceof UserBioChangedEvent,
        );

        expect(changedEvents).toHaveLength(0);
      });

      it('should throw a domain error when bio exceeds 500 characters', () => {
        const user = buildUser();
        const longBio = 'a'.repeat(501);

        expect(() => user.update({ bio: longBio })).toThrow();
      });

      it('should accept a bio of exactly 500 characters', () => {
        const user = buildUser();
        const maxBio = 'a'.repeat(500);

        expect(() => user.update({ bio: maxBio })).not.toThrow();
        expect(user.bio).toBe(maxBio);
      });
    });

    describe('locale', () => {
      it('should update locale when a different value is provided', () => {
        const user = buildUser();
        user.update({ locale: 'en-US' });

        expect(user.locale).toBe('en-US');
      });

      it('should emit UserLocaleChangedEvent when locale changes', () => {
        const user = buildUser();
        user.update({ locale: 'en-US' });

        const events = user.getUncommittedEvents();
        const event = events.find((e) => e instanceof UserLocaleChangedEvent);

        expect(event).toBeInstanceOf(UserLocaleChangedEvent);
      });

      it('should NOT emit UserLocaleChangedEvent when locale is unchanged', () => {
        const user = buildFullUser();
        user.update({ locale: 'es-AR' });

        const events = user.getUncommittedEvents();
        const changedEvents = events.filter(
          (e) => e instanceof UserLocaleChangedEvent,
        );

        expect(changedEvents).toHaveLength(0);
      });
    });

    describe('timezone', () => {
      it('should update timezone when a different value is provided', () => {
        const user = buildUser();
        user.update({ timezone: 'Europe/London' });

        expect(user.timezone).toBe('Europe/London');
      });

      it('should emit UserTimezoneChangedEvent when timezone changes', () => {
        const user = buildUser();
        user.update({ timezone: 'Europe/London' });

        const events = user.getUncommittedEvents();
        const event = events.find((e) => e instanceof UserTimezoneChangedEvent);

        expect(event).toBeInstanceOf(UserTimezoneChangedEvent);
      });

      it('should NOT emit UserTimezoneChangedEvent when timezone is unchanged', () => {
        const user = buildFullUser();
        user.update({ timezone: 'America/Buenos_Aires' });

        const events = user.getUncommittedEvents();
        const changedEvents = events.filter(
          (e) => e instanceof UserTimezoneChangedEvent,
        );

        expect(changedEvents).toHaveLength(0);
      });
    });
  });
});
