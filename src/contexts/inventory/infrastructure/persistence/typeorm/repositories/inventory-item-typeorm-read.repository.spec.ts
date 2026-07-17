import {
  Criteria,
  FilterOperator,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { InventoryItemBuilder } from '@contexts/inventory/domain/builders/inventory-item.builder';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemTypeOrmEntity } from '../entities/inventory-item.entity';
import { InventoryItemTypeOrmMapper } from '../mappers/inventory-item-typeorm.mapper';
import { InventoryItemTypeOrmReadRepository } from './inventory-item-typeorm-read.repository';

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

describe('InventoryItemTypeOrmReadRepository', () => {
  let repository: InventoryItemTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<InventoryItemTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<InventoryItemTypeOrmEntity>,
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
      | 'getManyAndCount'
    >
  >;
  let mapper: InventoryItemTypeOrmMapper;

  beforeEach(() => {
    mockQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as any;

    rawRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<InventoryItemTypeOrmEntity>>;

    mapper = new InventoryItemTypeOrmMapper(new InventoryItemBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new InventoryItemTypeOrmReadRepository(
      rawRepo,
      mapper,
      spaceContext,
    );
  });

  describe('findById()', () => {
    it('returns InventoryItemViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(ITEM_ID);

      expect(result).toBeInstanceOf(InventoryItemViewModel);
      expect(result!.id).toBe(ITEM_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('round-trips decimal quantity and threshold from string to number', async () => {
      rawRepo.findOne.mockResolvedValue(
        buildEntity({ quantity: '10.5', lowStockThreshold: '2' }),
      );

      const result = await repository.findById(ITEM_ID);

      expect(result!.quantity).toBe(10.5);
      expect(result!.lowStockThreshold).toBe(2);
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated results with view models', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(InventoryItemViewModel);
      expect(result.total).toBe(1);
      expect(mockQb.where).toHaveBeenCalledWith('item.space_id = :spaceId', {
        spaceId: SPACE_ID,
      });
    });

    it('returns empty result when no items match', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('defaults to createdAt DESC when no sort is given', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'item.createdAt',
        SortDirection.DESC,
      );
    });

    it('applies a client-supplied sort instead of the default', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria([], [{ field: 'name', direction: SortDirection.ASC }]),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'item.name',
        SortDirection.ASC,
      );
    });

    it('applies LIKE filter for name', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [{ field: 'name', operator: FilterOperator.LIKE, value: 'fert' }],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith('item.name ILIKE :filter0', {
        filter0: '%fert%',
      });
    });

    it('applies EQUALS filter for itemType', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'itemType',
              operator: FilterOperator.EQUALS,
              value: InventoryItemTypeEnum.FERTILIZER,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith('item.itemType = :filter0', {
        filter0: InventoryItemTypeEnum.FERTILIZER,
      });
    });

    it('applies the low_stock custom filter when value is truthy', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'low_stock',
              operator: FilterOperator.EQUALS,
              value: true,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'item.low_stock_threshold IS NOT NULL AND item.quantity <= item.low_stock_threshold',
      );
    });

    it('consumes the low_stock filter without adding a clause when value is falsy', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'low_stock',
              operator: FilterOperator.EQUALS,
              value: false,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('save()', () => {
    it('resolves without persisting (read-side no-op)', async () => {
      await expect(
        repository.save({} as InventoryItemViewModel),
      ).resolves.toBeUndefined();
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
