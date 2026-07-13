import { MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';

import { NotificationSseConnectionRegistry } from './notification-sse-connection.registry';

const USER_ID = 'user-1';
const SPACE_ID = 'space-1';

describe('NotificationSseConnectionRegistry', () => {
  let registry: NotificationSseConnectionRegistry;

  beforeEach(() => {
    registry = new NotificationSseConnectionRegistry();
  });

  it('delivers a published event to a registered connection', () => {
    const subject = new Subject<MessageEvent>();
    const received: MessageEvent[] = [];
    subject.subscribe((event) => received.push(event));

    registry.register(USER_ID, SPACE_ID, subject);
    registry.publish(USER_ID, SPACE_ID, { data: 'hello' });

    expect(received).toEqual([{ data: 'hello' }]);
  });

  it('delivers to every connection registered for the same user+space', () => {
    const subjectA = new Subject<MessageEvent>();
    const subjectB = new Subject<MessageEvent>();
    const receivedA: MessageEvent[] = [];
    const receivedB: MessageEvent[] = [];
    subjectA.subscribe((e) => receivedA.push(e));
    subjectB.subscribe((e) => receivedB.push(e));

    registry.register(USER_ID, SPACE_ID, subjectA);
    registry.register(USER_ID, SPACE_ID, subjectB);
    registry.publish(USER_ID, SPACE_ID, { data: 'hello' });

    expect(receivedA).toHaveLength(1);
    expect(receivedB).toHaveLength(1);
  });

  it('does not deliver to a deregistered connection', () => {
    const subject = new Subject<MessageEvent>();
    const received: MessageEvent[] = [];
    subject.subscribe((e) => received.push(e));

    registry.register(USER_ID, SPACE_ID, subject);
    registry.deregister(USER_ID, SPACE_ID, subject);
    registry.publish(USER_ID, SPACE_ID, { data: 'hello' });

    expect(received).toHaveLength(0);
  });

  it('publishing to a key with no registered connections is a silent no-op', () => {
    expect(() =>
      registry.publish('unknown-user', 'unknown-space', { data: 'x' }),
    ).not.toThrow();
  });

  it('does not deliver to a different user/space', () => {
    const subject = new Subject<MessageEvent>();
    const received: MessageEvent[] = [];
    subject.subscribe((e) => received.push(e));

    registry.register(USER_ID, SPACE_ID, subject);
    registry.publish('other-user', SPACE_ID, { data: 'hello' });

    expect(received).toHaveLength(0);
  });

  it('removes the registry entry once its connection set is empty', () => {
    const subject = new Subject<MessageEvent>();
    registry.register(USER_ID, SPACE_ID, subject);
    expect(registry.connectionCount(USER_ID, SPACE_ID)).toBe(1);

    registry.deregister(USER_ID, SPACE_ID, subject);
    expect(registry.connectionCount(USER_ID, SPACE_ID)).toBe(0);
  });
});
