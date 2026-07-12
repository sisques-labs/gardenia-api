import { Injectable } from '@nestjs/common';

import { NodeAggregate } from '@contexts/nodes/domain/aggregates/node.aggregate';
import { NodeBuilder } from '@contexts/nodes/domain/builders/node.builder';
import { NodeViewModel } from '@contexts/nodes/domain/view-models/node.view-model';
import { NodeTypeOrmEntity } from '../entities/node.entity';

@Injectable()
export class NodeTypeOrmMapper {
  constructor(private readonly nodeBuilder: NodeBuilder) {}

  public toAggregate(entity: NodeTypeOrmEntity): NodeAggregate {
    return this.nodeBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withBridgeId(entity.bridgeId)
      .withName(entity.name)
      .withStatus(entity.status)
      .withLastSeenAt(entity.lastSeenAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toEntity(aggregate: NodeAggregate): NodeTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new NodeTypeOrmEntity();

    entity.id = primitives.id;
    entity.spaceId = primitives.spaceId;
    entity.bridgeId = primitives.bridgeId;
    entity.name = primitives.name;
    entity.status = primitives.status;
    entity.lastSeenAt = primitives.lastSeenAt;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }

  public toViewModel(entity: NodeTypeOrmEntity): NodeViewModel {
    return this.nodeBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withBridgeId(entity.bridgeId)
      .withName(entity.name)
      .withStatus(entity.status)
      .withLastSeenAt(entity.lastSeenAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
