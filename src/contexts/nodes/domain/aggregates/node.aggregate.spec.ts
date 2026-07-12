import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NodeCreatedEvent } from '../events/node-created/node-created.event';
import { NodeWentOfflineEvent } from '../events/node-went-offline/node-went-offline.event';
import { NodeWentOnlineEvent } from '../events/node-went-online/node-went-online.event';
import { NodeStatusEnum } from '../enums/node-status.enum';
import { INode } from '../interfaces/node.interface';
import { NodeIdValueObject } from '../value-objects/node-id/node-id.value-object';
import { NodeStatusValueObject } from '../value-objects/node-status/node-status.value-object';
import { NodeAggregate } from './node.aggregate';

const NODE_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';
const BRIDGE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildNode = (overrides?: Partial<INode>): NodeAggregate =>
  new NodeAggregate({
    id: new NodeIdValueObject(NODE_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    bridgeId: new UuidValueObject(BRIDGE_ID),
    name: null,
    status: new NodeStatusValueObject(NodeStatusEnum.OFFLINE),
    lastSeenAt: null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
    ...overrides,
  });

describe('NodeAggregate', () => {
  describe('create()', () => {
    it('emits NodeCreatedEvent with the full snapshot', () => {
      const node = buildNode();
      node.create();

      const events = node.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(NodeCreatedEvent);
    });
  });

  describe('markOnline()', () => {
    it('flips status and emits NodeWentOnlineEvent when currently offline', () => {
      const node = buildNode();
      node.markOnline();

      expect(node.status.value).toBe(NodeStatusEnum.ONLINE);
      const events = node.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(NodeWentOnlineEvent);
    });

    it('is a no-op (no event) when already online', () => {
      const node = buildNode({
        status: new NodeStatusValueObject(NodeStatusEnum.ONLINE),
      });
      node.markOnline();

      expect(node.getUncommittedEvents()).toHaveLength(0);
    });

    it('emits exactly one event across two consecutive calls', () => {
      const node = buildNode();
      node.markOnline();
      node.markOnline();

      expect(node.getUncommittedEvents()).toHaveLength(1);
    });
  });

  describe('markOffline()', () => {
    it('flips status and emits NodeWentOfflineEvent when currently online', () => {
      const node = buildNode({
        status: new NodeStatusValueObject(NodeStatusEnum.ONLINE),
      });
      node.markOffline();

      expect(node.status.value).toBe(NodeStatusEnum.OFFLINE);
      const events = node.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(NodeWentOfflineEvent);
    });

    it('is a no-op when already offline', () => {
      const node = buildNode();
      node.markOffline();

      expect(node.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('touchLastSeen()', () => {
    it('updates lastSeenAt', () => {
      const node = buildNode();
      const seenAt = new Date('2024-06-01');
      node.touchLastSeen(seenAt);

      expect(node.lastSeenAt).toBe(seenAt);
    });
  });
});
