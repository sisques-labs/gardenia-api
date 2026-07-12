import { Injectable } from '@nestjs/common';

import { BridgeAggregate } from '@contexts/nodes/domain/aggregates/bridge.aggregate';
import { BridgeBuilder } from '@contexts/nodes/domain/builders/bridge.builder';
import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';
import { BridgeTypeOrmEntity } from '../entities/bridge.entity';

@Injectable()
export class BridgeTypeOrmMapper {
  constructor(private readonly bridgeBuilder: BridgeBuilder) {}

  public toAggregate(entity: BridgeTypeOrmEntity): BridgeAggregate {
    return this.bridgeBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withName(entity.name)
      .withStatus(entity.status)
      .withPairingCode(entity.pairingCode)
      .withLastSeenAt(entity.lastSeenAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toEntity(aggregate: BridgeAggregate): BridgeTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new BridgeTypeOrmEntity();

    entity.id = primitives.id;
    entity.spaceId = primitives.spaceId;
    entity.name = primitives.name;
    entity.status = primitives.status;
    entity.pairingCode = primitives.pairingCode;
    entity.lastSeenAt = primitives.lastSeenAt;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }

  public toViewModel(entity: BridgeTypeOrmEntity): BridgeViewModel {
    return this.bridgeBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withName(entity.name)
      .withStatus(entity.status)
      .withPairingCode(entity.pairingCode)
      .withLastSeenAt(entity.lastSeenAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
