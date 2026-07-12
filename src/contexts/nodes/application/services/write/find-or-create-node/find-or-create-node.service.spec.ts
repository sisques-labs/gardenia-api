import { EventBus } from '@nestjs/cqrs';

import { NodeBuilder } from '@contexts/nodes/domain/builders/node.builder';
import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import { IBridgeReadRepository } from '@contexts/nodes/domain/repositories/read/bridge-read.repository';
import { INodeWriteRepository } from '@contexts/nodes/domain/repositories/write/node-write.repository';
import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { FindOrCreateNodeService } from './find-or-create-node.service';

const NODE_ID = '550e8400-e29b-41d4-a716-446655440000';
const BRIDGE_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';

function activeBridge(): BridgeViewModel {
  return new BridgeViewModel({
    id: BRIDGE_ID,
    spaceId: SPACE_ID,
    name: null,
    status: BridgeStatusEnum.ACTIVE,
    pairingCode: null,
    lastSeenAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('FindOrCreateNodeService', () => {
  let service: FindOrCreateNodeService;
  let bridgeReadRepository: jest.Mocked<IBridgeReadRepository>;
  let nodeWriteRepository: jest.Mocked<INodeWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let spaceContext: SpaceContext;

  beforeEach(() => {
    bridgeReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IBridgeReadRepository>;

    nodeWriteRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      delete: jest.fn(),
    } as jest.Mocked<INodeWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    spaceContext = new SpaceContext();

    service = new FindOrCreateNodeService(
      bridgeReadRepository,
      nodeWriteRepository,
      new NodeBuilder(),
      spaceContext,
      eventBus,
    );
  });

  it('returns null and does not touch node repo when bridge is unknown', async () => {
    bridgeReadRepository.findById.mockResolvedValue(null);

    const result = await service.execute({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
    });

    expect(result).toBeNull();
    expect(nodeWriteRepository.findById).not.toHaveBeenCalled();
  });

  it('returns null when the bridge is still UNCLAIMED', async () => {
    bridgeReadRepository.findById.mockResolvedValue(
      new BridgeViewModel({
        id: BRIDGE_ID,
        spaceId: null,
        name: null,
        status: BridgeStatusEnum.UNCLAIMED,
        pairingCode: 'GRDN-AAAA',
        lastSeenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const result = await service.execute({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
    });

    expect(result).toBeNull();
  });

  it('returns the existing node when already present (scoped via the resolved spaceId)', async () => {
    bridgeReadRepository.findById.mockResolvedValue(activeBridge());
    const existing = new NodeBuilder()
      .withId(NODE_ID)
      .withSpaceId(SPACE_ID)
      .withBridgeId(BRIDGE_ID)
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    nodeWriteRepository.findById.mockResolvedValue(existing);

    const result = await service.execute({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
    });

    expect(result).toBe(existing);
    expect(nodeWriteRepository.save).not.toHaveBeenCalled();
  });

  it('creates and persists a new node on first-seen, scoped to the bridge spaceId', async () => {
    bridgeReadRepository.findById.mockResolvedValue(activeBridge());
    nodeWriteRepository.findById.mockResolvedValue(null);

    const result = await service.execute({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
    });

    expect(result).not.toBeNull();
    expect(result!.spaceId.value).toBe(SPACE_ID);
    expect(nodeWriteRepository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('sets the SpaceContext ALS frame to the resolved bridge spaceId while calling the node repo', async () => {
    bridgeReadRepository.findById.mockResolvedValue(activeBridge());
    nodeWriteRepository.findById.mockImplementation(async () => {
      expect(spaceContext.get()).toBe(SPACE_ID);
      return null;
    });

    await service.execute({ nodeId: NODE_ID, bridgeId: BRIDGE_ID });

    expect.assertions(1);
  });
});
