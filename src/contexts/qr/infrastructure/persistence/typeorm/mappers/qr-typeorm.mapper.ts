import { Injectable } from '@nestjs/common';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrSaveOptions } from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { QrTypeOrmEntity } from '../entities/qr.entity';

@Injectable()
export class QrTypeOrmMapper {
  constructor(private readonly qrBuilder: QrBuilder) {}

  public toAggregate(entity: QrTypeOrmEntity): QrAggregate {
    return this.qrBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withTargetUrl(entity.targetUrl)
      .withGeneration(entity.generation)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toEntity(
    aggregate: QrAggregate,
    pngImage: Buffer,
    options?: QrSaveOptions,
  ): QrTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new QrTypeOrmEntity();

    entity.id = primitives.id;
    entity.spaceId = primitives.spaceId;
    entity.targetUrl = primitives.targetUrl;
    entity.generation = primitives.generation;
    entity.pngImage = pngImage;
    entity.plantId = null;
    if (options?.plantId !== undefined) {
      entity.plantId = options.plantId;
    }
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
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
