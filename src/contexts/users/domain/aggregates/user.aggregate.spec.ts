import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserCreatedEvent } from '@contexts/users/domain/events/user-created/user-created.event';
import { UserDeletedEvent } from '@contexts/users/domain/events/user-deleted/user-deleted.event';
import { UserStatusChangedEvent } from '@contexts/users/domain/events/field-changed/user-status-changed/user-status-changed.event';
import { UserUpdatedEvent } from '@contexts/users/domain/events/user-updated/user-updated.event';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserAggregate } from './user.aggregate';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

const buildUser = (status: UserStatusEnum = UserStatusEnum.ACTIVE): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(status)
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
      const statusEvent = events.find(e => e instanceof UserStatusChangedEvent);

      expect(statusEvent).toBeDefined();
      expect(statusEvent).toBeInstanceOf(UserStatusChangedEvent);
    });

    it('should record the old and new status in the event data', () => {
      const user = buildUser(UserStatusEnum.INACTIVE);
      user.activate();

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(e => e instanceof UserStatusChangedEvent) as UserStatusChangedEvent;

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
      const statusEvent = events.find(e => e instanceof UserStatusChangedEvent);

      expect(statusEvent).toBeInstanceOf(UserStatusChangedEvent);
    });

    it('should record old status ACTIVE and new status INACTIVE', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.deactivate();

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(e => e instanceof UserStatusChangedEvent) as UserStatusChangedEvent;

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
      const statusEvent = events.find(e => e instanceof UserStatusChangedEvent);

      expect(statusEvent).toBeInstanceOf(UserStatusChangedEvent);
    });
  });

  describe('delete()', () => {
    it('should emit a UserDeletedEvent', () => {
      const user = buildUser();
      user.delete();

      const events = user.getUncommittedEvents();
      const deletedEvent = events.find(e => e instanceof UserDeletedEvent);

      expect(deletedEvent).toBeInstanceOf(UserDeletedEvent);
    });

    it('should emit UserDeletedEvent with correct metadata', () => {
      const user = buildUser();
      user.delete();

      const events = user.getUncommittedEvents();
      const deletedEvent = events.find(e => e instanceof UserDeletedEvent) as UserDeletedEvent;

      expect(deletedEvent.aggregateRootId).toBe(USER_ID);
      expect(deletedEvent.entityType).toBe(UserAggregate.name);
    });

    it('should include primitives in the UserDeletedEvent data', () => {
      const user = buildUser();
      user.delete();

      const events = user.getUncommittedEvents();
      const deletedEvent = events.find(e => e instanceof UserDeletedEvent) as UserDeletedEvent;

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
      const statusEvent = events.find(e => e instanceof UserStatusChangedEvent) as UserStatusChangedEvent;

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
      const updatedEvent = events.find(e => e instanceof UserUpdatedEvent);

      expect(updatedEvent).toBeInstanceOf(UserUpdatedEvent);
    });

    it('should emit a UserStatusChangedEvent when status is provided', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      const { UserStatusValueObject } = require('@contexts/users/domain/value-objects/user-status/user-status.vo');
      user.update({ status: new UserStatusValueObject(UserStatusEnum.INACTIVE) });

      const events = user.getUncommittedEvents();
      const statusEvent = events.find(e => e instanceof UserStatusChangedEvent);

      expect(statusEvent).toBeInstanceOf(UserStatusChangedEvent);
    });

    it('should NOT emit a UserStatusChangedEvent when status is not provided', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      user.update({});

      const events = user.getUncommittedEvents();
      const statusEvents = events.filter(e => e instanceof UserStatusChangedEvent);

      expect(statusEvents).toHaveLength(0);
    });

    it('should update the status when provided', () => {
      const user = buildUser(UserStatusEnum.ACTIVE);
      const { UserStatusValueObject } = require('@contexts/users/domain/value-objects/user-status/user-status.vo');
      user.update({ status: new UserStatusValueObject(UserStatusEnum.INACTIVE) });

      expect(user.status.value).toBe(UserStatusEnum.INACTIVE);
    });
  });

  describe('toPrimitives() — round-trip', () => {
    it('should return primitives matching the constructed values', () => {
      const user = buildUser();
      const primitives = user.toPrimitives();

      expect(primitives.id).toBe(USER_ID);
      expect(primitives.status).toBe(UserStatusEnum.ACTIVE);
      expect(primitives.createdAt).toEqual(CREATED_AT);
      expect(primitives.updatedAt).toEqual(UPDATED_AT);
    });

    it('should reconstruct an equivalent aggregate from toPrimitives() output', () => {
      const original = buildUser();
      const primitives = original.toPrimitives();

      const reconstructed = new UserBuilder()
        .withId(primitives.id)
        .withStatus(primitives.status)
        .withCreatedAt(primitives.createdAt)
        .withUpdatedAt(primitives.updatedAt)
        .build();

      expect(reconstructed.id.value).toBe(original.id.value);
      expect(reconstructed.status.value).toBe(original.status.value);
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

    it('should expose createdAt from BaseAggregate', () => {
      const user = buildUser();

      expect(user.createdAt.value).toEqual(CREATED_AT);
    });

    it('should expose updatedAt from BaseAggregate', () => {
      const user = buildUser();

      expect(user.updatedAt.value).toEqual(UPDATED_AT);
    });
  });
});
