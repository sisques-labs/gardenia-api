import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemBuilder } from '@contexts/inventory/domain/builders/inventory-item.builder';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemTypeOrmEntity } from '../entities/inventory-item.entity';
import { InventoryItemTypeOrmMapper } from './inventory-item-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const buildEntity = (
  overrides: Partial<InventoryItemTypeOrmEntity> = {},
): InventoryItemTypeOrmEntity => {
  const entity = new InventoryItemTypeOrmEntity();
  entity.id = ID;
  entity.itemType = InventoryItemTypeEnum.FERTILIZER;
  entity.name = 'Universal fertilizer';
  entity.brand = 'Compo';
  entity.notes = 'Keep dry';
  entity.quantity = '10.5';
  entity.unit = InventoryUnitEnum.KG;
  entity.lowStockThreshold = '2';
  entity.acquiredAt = new Date('2026-01-05');
  entity.expiresAt = new Date('2027-01-05');
  entity.userId = USER_ID;
  entity.spaceId = SPACE_ID;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return Object.assign(entity, overrides);
};

describe('InventoryItemTypeOrmMapper', () => {
  let mapper: InventoryItemTypeOrmMapper;

  beforeEach(() => {
    mapper = new InventoryItemTypeOrmMapper(new InventoryItemBuilder());
  });

  describe('toDomain()', () => {
    it('parses numeric strings for quantity and low stock threshold', () => {
      const result = mapper.toDomain(buildEntity());

      expect(result).toBeInstanceOf(InventoryItemAggregate);
      expect(result.quantity.value).toBe(10.5);
      expect(result.lowStockThreshold?.value).toBe(2);
      expect(result.brand?.value).toBe('Compo');
    });

    it('maps a null low stock threshold', () => {
      const result = mapper.toDomain(
        buildEntity({ lowStockThreshold: null, brand: null, notes: null }),
      );

      expect(result.lowStockThreshold).toBeNull();
      expect(result.brand).toBeNull();
      expect(result.notes).toBeNull();
    });
  });

  describe('toPersistence()', () => {
    it('stringifies numeric fields', () => {
      const aggregate = mapper.toDomain(buildEntity());

      const result = mapper.toPersistence(aggregate);

      expect(result.quantity).toBe('10.5');
      expect(typeof result.quantity).toBe('string');
      expect(result.lowStockThreshold).toBe('2');
    });

    it('keeps a null low stock threshold as null', () => {
      const aggregate = mapper.toDomain(
        buildEntity({ lowStockThreshold: null }),
      );

      const result = mapper.toPersistence(aggregate);

      expect(result.lowStockThreshold).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('preserves numeric values through toDomain → toPersistence', () => {
      const original = buildEntity();

      const result = mapper.toPersistence(mapper.toDomain(original));

      expect(result.quantity).toBe(original.quantity);
      expect(result.lowStockThreshold).toBe(original.lowStockThreshold);
    });
  });
});
