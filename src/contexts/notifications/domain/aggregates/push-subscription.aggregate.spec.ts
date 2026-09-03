import {
  DateValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PushSubscriptionRegisteredEvent } from '@contexts/notifications/domain/events/push-subscription-registered/push-subscription-registered.event';
import { PushSubscriptionUnregisteredEvent } from '@contexts/notifications/domain/events/push-subscription-unregistered/push-subscription-unregistered.event';
import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionEndpointValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object';
import { PushSubscriptionIdValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-id/push-subscription-id.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

import { PushSubscriptionAggregate } from './push-subscription.aggregate';

function buildSubscription(): PushSubscriptionAggregate {
  return new PushSubscriptionAggregate({
    id: new PushSubscriptionIdValueObject(
      '550e8400-e29b-41d4-a716-446655440000',
    ),
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    endpoint: new PushSubscriptionEndpointValueObject(
      'https://fcm.googleapis.com/fcm/send/abc123',
    ),
    p256dh: new PushSubscriptionP256dhValueObject('p256dh-key'),
    auth: new PushSubscriptionAuthValueObject('auth-secret'),
    userAgent: new StringValueObject('Mozilla/5.0'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('PushSubscriptionAggregate', () => {
  it('create() applies PushSubscriptionRegisteredEvent', () => {
    const subscription = buildSubscription();
    subscription.create();
    const events = subscription.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PushSubscriptionRegisteredEvent);
  });

  it('reassign() updates userId, keys, and userAgent without emitting an event', () => {
    const subscription = buildSubscription();
    const newUserId = new UuidValueObject(
      '770e8400-e29b-41d4-a716-446655440002',
    );
    const newP256dh = new PushSubscriptionP256dhValueObject('new-p256dh');
    const newAuth = new PushSubscriptionAuthValueObject('new-auth');

    subscription.reassign(newUserId, newP256dh, newAuth, null);

    expect(subscription.userId.value).toBe(newUserId.value);
    expect(subscription.p256dh.value).toBe('new-p256dh');
    expect(subscription.auth.value).toBe('new-auth');
    expect(subscription.userAgent).toBeNull();
    expect(subscription.getUncommittedEvents()).toHaveLength(0);
  });

  it('delete() applies PushSubscriptionUnregisteredEvent', () => {
    const subscription = buildSubscription();
    subscription.delete();
    const events = subscription.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PushSubscriptionUnregisteredEvent);
  });

  it('exposes id, userId, and endpoint getters', () => {
    const subscription = buildSubscription();
    expect(subscription.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(subscription.userId.value).toBe(
      '660e8400-e29b-41d4-a716-446655440001',
    );
    expect(subscription.endpoint.value).toBe(
      'https://fcm.googleapis.com/fcm/send/abc123',
    );
  });
});
