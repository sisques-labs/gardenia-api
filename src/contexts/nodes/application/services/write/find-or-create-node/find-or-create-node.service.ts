import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { NodeBuilder } from '@contexts/nodes/domain/builders/node.builder';
import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import {
  BRIDGE_READ_REPOSITORY,
  IBridgeReadRepository,
} from '@contexts/nodes/domain/repositories/read/bridge-read.repository';
import {
  NODE_WRITE_REPOSITORY,
  INodeWriteRepository,
} from '@contexts/nodes/domain/repositories/write/node-write.repository';
import { NodeAggregate } from '@contexts/nodes/domain/aggregates/node.aggregate';
import { SpaceContext } from '@shared/space-context/space-context.service';

/**
 * Resolves (or first-seen-creates) the `NodeAggregate` for an inbound Kafka
 * message. `spaceId` is NEVER derived from the node itself — it always
 * comes from the node's bridge (the bridge is the tenancy anchor for every
 * node it relays). Wraps the tenant-scoped node repository calls in
 * `SpaceContext.run()` so the same `NODE_WRITE_REPOSITORY` token used by
 * HTTP/GraphQL handlers works correctly here too, even though there is no
 * `SpaceInterceptor`-opened ALS frame on the Kafka-consumer path. See
 * design.md §5.4.
 */
@Injectable()
export class FindOrCreateNodeService {
  private readonly logger = new Logger(FindOrCreateNodeService.name);

  constructor(
    @Inject(BRIDGE_READ_REPOSITORY)
    private readonly bridgeReadRepository: IBridgeReadRepository,
    @Inject(NODE_WRITE_REPOSITORY)
    private readonly nodeWriteRepository: INodeWriteRepository,
    private readonly nodeBuilder: NodeBuilder,
    private readonly spaceContext: SpaceContext,
    private readonly eventBus: EventBus,
  ) {}

  async execute(props: {
    nodeId: string;
    bridgeId: string;
  }): Promise<NodeAggregate | null> {
    const bridge = await this.bridgeReadRepository.findById(props.bridgeId);

    if (
      !bridge ||
      bridge.status !== BridgeStatusEnum.ACTIVE ||
      !bridge.spaceId
    ) {
      this.logger.warn(
        `Dropping message for node ${props.nodeId} — bridge ${props.bridgeId} is unknown or not claimed`,
      );
      return null;
    }

    const spaceId = bridge.spaceId;

    return this.spaceContext.run(spaceId, async () => {
      const existing = await this.nodeWriteRepository.findById(props.nodeId);
      if (existing) return existing;

      const now = new Date();
      const node = this.nodeBuilder
        .withId(props.nodeId)
        .withSpaceId(spaceId)
        .withBridgeId(props.bridgeId)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build();

      node.create();
      await this.nodeWriteRepository.save(node);
      await this.eventBus.publishAll(node.getUncommittedEvents());
      await node.commit();

      this.logger.log(
        `Node ${node.id.value} first-seen via bridge ${props.bridgeId}, space ${spaceId}`,
      );

      return node;
    });
  }
}
