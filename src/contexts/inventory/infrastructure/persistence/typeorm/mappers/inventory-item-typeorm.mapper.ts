import { Injectable } from '@nestjs/common';

import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemBuilder } from '@contexts/inventory/domain/builders/inventory-item.builder';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemTypeOrmEntity } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryItemTypeOrmMapper {
  constructor(private readonly builder: InventoryItemBuilder) {}

  public toDomain(entity: InventoryItemTypeOrmEntity): InventoryItemAggregate {
    return this.builder
      .withId(entity.id)
      .withItemType(entity.itemType)
      .withName(entity.name)
      .withBrand(entity.brand)
      .withNotes(entity.notes)
      .withQuantity(parseFloat(entity.quantity))
      .withUnit(entity.unit)
      .withLowStockThreshold(
        entity.lowStockThreshold != null
          ? parseFloat(entity.lowStockThreshold)
          : null,
      )
      .withAcquiredAt(entity.acquiredAt)
      .withExpiresAt(entity.expiresAt)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toViewModel(
    entity: InventoryItemTypeOrmEntity,
  ): InventoryItemViewModel {
    return this.builder
      .withId(entity.id)
      .withItemType(entity.itemType)
      .withName(entity.name)
      .withBrand(entity.brand)
      .withNotes(entity.notes)
      .withQuantity(parseFloat(entity.quantity))
      .withUnit(entity.unit)
      .withLowStockThreshold(
        entity.lowStockThreshold != null
          ? parseFloat(entity.lowStockThreshold)
          : null,
      )
      .withAcquiredAt(entity.acquiredAt)
      .withExpiresAt(entity.expiresAt)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }

  public toPersistence(
    aggregate: InventoryItemAggregate,
  ): InventoryItemTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new InventoryItemTypeOrmEntity();
    entity.id = primitives.id;
    entity.itemType = primitives.itemType;
    entity.name = primitives.name;
    entity.brand = primitives.brand;
    entity.notes = primitives.notes;
    entity.quantity = primitives.quantity.toString();
    entity.unit = primitives.unit;
    entity.lowStockThreshold =
      primitives.lowStockThreshold != null
        ? primitives.lowStockThreshold.toString()
        : null;
    entity.acquiredAt = primitives.acquiredAt;
    entity.expiresAt = primitives.expiresAt;
    entity.userId = primitives.userId;
    entity.spaceId = primitives.spaceId;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }
}
