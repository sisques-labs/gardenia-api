import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { BridgeAlreadyClaimedException } from '../exceptions/bridge-already-claimed.exception';
import { InvalidPairingCodeException } from '../exceptions/invalid-pairing-code.exception';
import { BridgeBootstrappedEvent } from '../events/bridge-bootstrapped/bridge-bootstrapped.event';
import { BridgeClaimedEvent } from '../events/bridge-claimed/bridge-claimed.event';
import { BridgeStatusEnum } from '../enums/bridge-status.enum';
import { IBridge } from '../interfaces/bridge.interface';
import { BridgeIdValueObject } from '../value-objects/bridge-id/bridge-id.value-object';
import { BridgeStatusValueObject } from '../value-objects/bridge-status/bridge-status.value-object';
import { PairingCodeValueObject } from '../value-objects/pairing-code/pairing-code.value-object';
import { BridgeAggregate } from './bridge.aggregate';

const BRIDGE_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';
const NOW = new Date('2024-01-01');

const buildBridge = (overrides?: Partial<IBridge>): BridgeAggregate =>
  new BridgeAggregate({
    id: new BridgeIdValueObject(BRIDGE_ID),
    spaceId: null,
    name: null,
    status: new BridgeStatusValueObject(BridgeStatusEnum.UNCLAIMED),
    pairingCode: null,
    lastSeenAt: null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
    ...overrides,
  });

describe('BridgeAggregate', () => {
  describe('bootstrap()', () => {
    it('sets UNCLAIMED status and generates a pairing code for a fresh bridge', () => {
      const bridge = buildBridge();
      bridge.bootstrap();

      expect(bridge.status.value).toBe(BridgeStatusEnum.UNCLAIMED);
      expect(bridge.pairingCode).not.toBeNull();
      expect(bridge.pairingCode!.value).toMatch(/^GRDN-[A-Z0-9]{4}$/);

      const events = bridge.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BridgeBootstrappedEvent);
    });

    it('rotates the pairing code on a re-bootstrap while UNCLAIMED', () => {
      const bridge = buildBridge({
        pairingCode: new PairingCodeValueObject('GRDN-AAAA'),
      });
      bridge.bootstrap();

      expect(bridge.pairingCode!.value).not.toBe('GRDN-AAAA');
    });

    it('is a no-op when the bridge is already ACTIVE', () => {
      const bridge = buildBridge({
        status: new BridgeStatusValueObject(BridgeStatusEnum.ACTIVE),
        spaceId: null,
        pairingCode: null,
      });
      bridge.bootstrap();

      expect(bridge.status.value).toBe(BridgeStatusEnum.ACTIVE);
      expect(bridge.pairingCode).toBeNull();
      expect(bridge.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('claim()', () => {
    it('claims an unclaimed bridge with the correct code', () => {
      const bridge = buildBridge({
        pairingCode: new PairingCodeValueObject('GRDN-AAAA'),
      });
      bridge.claim(SPACE_ID, 'GRDN-AAAA');

      expect(bridge.status.value).toBe(BridgeStatusEnum.ACTIVE);
      expect(bridge.spaceId!.value).toBe(SPACE_ID);
      expect(bridge.pairingCode).toBeNull();

      const events = bridge.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BridgeClaimedEvent);
    });

    it('throws InvalidPairingCodeException for a wrong code', () => {
      const bridge = buildBridge({
        pairingCode: new PairingCodeValueObject('GRDN-AAAA'),
      });

      expect(() => bridge.claim(SPACE_ID, 'GRDN-ZZZZ')).toThrow(
        InvalidPairingCodeException,
      );
    });

    it('throws BridgeAlreadyClaimedException when not UNCLAIMED', () => {
      const bridge = buildBridge({
        status: new BridgeStatusValueObject(BridgeStatusEnum.ACTIVE),
        spaceId: null,
      });

      expect(() => bridge.claim(SPACE_ID, 'GRDN-AAAA')).toThrow(
        BridgeAlreadyClaimedException,
      );
    });
  });
});
