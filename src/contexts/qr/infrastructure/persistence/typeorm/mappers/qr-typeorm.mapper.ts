import { Injectable } from '@nestjs/common';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrTypeOrmEntity } from '@contexts/qr/infrastructure/persistence/typeorm/entities/qr.entity';

@Injectable()
export class QrTypeOrmMapper {
  constructor(private readonly qrBuilder: QrBuilder) {}

  public toAggregate(entity: QrTypeOrmEntity): QrAggregate {
    return this.qrBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withTargetUrl(entity.targetUrl)
      .withGeneration(entity.generation)
      .withExpiresAt(entity.expiresAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toEntity(aggregate: QrAggregate, pngImage: Buffer): QrTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new QrTypeOrmEntity();

    entity.id = primitives.id;
    entity.spaceId = primitives.spaceId;
    entity.targetUrl = primitives.targetUrl;
    entity.generation = primitives.generation;
    entity.expiresAt = primitives.expiresAt;
    entity.pngImage = pngImage;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }

  public toViewModel(entity: QrTypeOrmEntity): QrViewModel {
    return this.qrBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withTargetUrl(entity.targetUrl)
      .withGeneration(entity.generation)
      .withExpiresAt(entity.expiresAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
