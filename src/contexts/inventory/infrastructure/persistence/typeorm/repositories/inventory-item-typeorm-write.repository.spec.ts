import { Criteria } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { InventoryItemBuilder } from '@contexts/inventory/domain/builders/inventory-item.builder';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemTypeOrmEntity } from '../entities/inventory-item.entity';
import { InventoryItemTypeOrmMapper } from '../mappers/inventory-item-typeorm.mapper';
import { InventoryItemTypeOrmWriteRepository } from './inventory-item-typeorm-write.repository';

const ITEM_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<InventoryItemTypeOrmEntity> = {},
): InventoryItemTypeOrmEntity => {
  const e = new InventoryItemTypeOrmEntity();
  e.id = ITEM_ID;
  e.itemType = InventoryItemTypeEnum.FERTILIZER;
  e.name = 'Universal fertilizer';
  e.brand = 'Compo';
  e.notes = 'Keep dry';
  e.quantity = '10.5';
  e.unit = InventoryUnitEnum.KG;
  e.lowStockThreshold = '2';
  e.acquiredAt = new Date('2026-01-05');
  e.expiresAt = new Date('2027-01-05');
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new InventoryItemBuilder()
    .withId(ITEM_ID)
    .withItemType(InventoryItemTypeEnum.FERTILIZER)
    .withName('Universal fertilizer')
    .withBrand('Compo')
    .withNotes('Keep dry')
    .withQuantity(10.5)
    .withUnit(InventoryUnitEnum.KG)
    .withLowStockThreshold(2)
    .withAcquiredAt(new Date('2026-01-05'))
    .withExpiresAt(new Date('2027-01-05'))
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('InventoryItemTypeOrmWriteRepository', () => {
  let repository: InventoryItemTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<InventoryItemTypeOrmEntity>>;
  let mapper: InventoryItemTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<InventoryItemTypeOrmEntity>>;

    mapper = new InventoryItemTypeOrmMapper(new InventoryItemBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new InventoryItemTypeOrmWriteRepository(
      mapper,
      rawRepo,
      spaceContext,
    );
  });

  describe('save()', () => {
    it('persists the aggregate and returns domain object', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result.toPrimitives().id).toBe(ITEM_ID);
    });

    it('round-trips decimal quantity and threshold correctly', async () => {
      rawRepo.save.mockResolvedValue(
        buildEntity({ quantity: '10.5', lowStockThreshold: '2' }),
      );
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(result.toPrimitives().quantity).toBe(10.5);
      expect(result.toPrimitives().lowStockThreshold).toBe(2);
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(ITEM_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(ITEM_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated aggregates', async () => {
      rawRepo.findAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].toPrimitives().id).toBe(ITEM_ID);
      expect(result.total).toBe(1);
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(ITEM_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
