import { EventBus } from '@nestjs/cqrs';

import { BridgeBuilder } from '@contexts/nodes/domain/builders/bridge.builder';
import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import { IBridgeWriteRepository } from '@contexts/nodes/domain/repositories/write/bridge-write.repository';

import { BootstrapBridgeCommand } from './bootstrap-bridge.command';
import { BootstrapBridgeCommandHandler } from './bootstrap-bridge.handler';

const BRIDGE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('BootstrapBridgeCommandHandler', () => {
  let handler: BootstrapBridgeCommandHandler;
  let writeRepository: jest.Mocked<IBridgeWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      delete: jest.fn(),
    } as jest.Mocked<IBridgeWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new BootstrapBridgeCommandHandler(
      writeRepository,
      new BridgeBuilder(),
      eventBus,
    );
  });

  it('creates a fresh bridge in UNCLAIMED status with a pairing code', async () => {
    writeRepository.findById.mockResolvedValue(null);

    const result = await handler.execute(
      new BootstrapBridgeCommand({ bridgeId: BRIDGE_ID }),
    );

    expect(result.bridgeId).toBe(BRIDGE_ID);
    expect(result.pairingCode).toMatch(/^GRDN-[A-Z0-9]{4}$/);
    expect(writeRepository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('rotates the pairing code for an already-unclaimed bridge', async () => {
    const existing = new BridgeBuilder()
      .withId(BRIDGE_ID)
      .withStatus(BridgeStatusEnum.UNCLAIMED)
      .withPairingCode('GRDN-AAAA')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    writeRepository.findById.mockResolvedValue(existing);

    const result = await handler.execute(
      new BootstrapBridgeCommand({ bridgeId: BRIDGE_ID }),
    );

    expect(result.pairingCode).not.toBe('GRDN-AAAA');
  });

  it('returns no pairing code for an already-claimed bridge (no-op)', async () => {
    const existing = new BridgeBuilder()
      .withId(BRIDGE_ID)
      .withStatus(BridgeStatusEnum.ACTIVE)
      .withSpaceId('550e8400-e29b-41d4-a716-446655440099')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    writeRepository.findById.mockResolvedValue(existing);

    const result = await handler.execute(
      new BootstrapBridgeCommand({ bridgeId: BRIDGE_ID }),
    );

    expect(result.pairingCode).toBeNull();
  });
});
