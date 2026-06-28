import { Injectable } from '@nestjs/common';

import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileTypeOrmEntity } from '../entities/file.entity';

@Injectable()
export class FileTypeOrmMapper {
  constructor(private readonly builder: FileBuilder) {}

  public toDomain(entity: FileTypeOrmEntity): FileAggregate {
    return this.builder
      .withId(entity.id)
      .withFilename(entity.filename)
      .withMimeType(entity.mimeType)
      .withSize(entity.size)
      .withStorageKey(entity.storageKey)
      .withUrl(entity.url)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(aggregate: FileAggregate): FileTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new FileTypeOrmEntity();
    entity.id = primitives.id;
    entity.filename = primitives.filename;
    entity.mimeType = primitives.mimeType;
    entity.size = primitives.size;
    entity.storageKey = primitives.storageKey;
    entity.url = primitives.url;
    entity.userId = primitives.userId;
    entity.spaceId = primitives.spaceId;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }

  public toViewModel(entity: FileTypeOrmEntity): FileViewModel {
    return this.builder
      .withId(entity.id)
      .withFilename(entity.filename)
      .withMimeType(entity.mimeType)
      .withSize(entity.size)
      .withStorageKey(entity.storageKey)
      .withUrl(entity.url)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
