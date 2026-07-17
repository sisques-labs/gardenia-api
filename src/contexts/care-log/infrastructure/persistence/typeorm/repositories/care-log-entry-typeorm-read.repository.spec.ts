import {
  Criteria,
  FilterOperator,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogEntryBuilder } from '@contexts/care-log/domain/builders/care-log-entry.builder';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CareLogEntryTypeOrmEntity } from '../entities/care-log-entry.entity';
import { CareLogEntryTypeOrmMapper } from '../mappers/care-log-entry-typeorm.mapper';
import { CareLogEntryTypeOrmReadRepository } from './care-log-entry-typeorm-read.repository';

const ENTRY_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<CareLogEntryTypeOrmEntity> = {},
): CareLogEntryTypeOrmEntity => {
  const e = new CareLogEntryTypeOrmEntity();
  e.id = ENTRY_ID;
  e.plantId = PLANT_ID;
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.activityType = CareLogActivityTypeEnum.WATERING;
  e.performedAt = new Date('2026-06-01');
  e.notes = 'Watered well';
  e.quantity = 500;
  e.unit = CareLogUnitEnum.ML;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

describe('CareLogEntryTypeOrmReadRepository', () => {
  let repository: CareLogEntryTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<CareLogEntryTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<CareLogEntryTypeOrmEntity>,
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
      | 'getManyAndCount'
    >
  >;
  let mapper: CareLogEntryTypeOrmMapper;

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
    } as unknown as jest.Mocked<Repository<CareLogEntryTypeOrmEntity>>;

    mapper = new CareLogEntryTypeOrmMapper(new CareLogEntryBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new CareLogEntryTypeOrmReadRepository(
      rawRepo,
      mapper,
      spaceContext,
    );
  });

  describe('findById()', () => {
    it('returns CareLogEntryViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(ENTRY_ID);

      expect(result).toBeInstanceOf(CareLogEntryViewModel);
      expect(result!.id).toBe(ENTRY_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findLastByType()', () => {
    it('queries by plantId and activityType ordered by performedAt DESC', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findLastByType(
        PLANT_ID,
        CareLogActivityTypeEnum.WATERING,
      );

      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: {
          plantId: PLANT_ID,
          activityType: CareLogActivityTypeEnum.WATERING,
          spaceId: SPACE_ID,
        },
        order: { performedAt: 'DESC' },
      });
      expect(result).toBeInstanceOf(CareLogEntryViewModel);
    });

    it('returns null when no matching entry exists', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findLastByType(
        PLANT_ID,
        CareLogActivityTypeEnum.PRUNING,
      );

      expect(result).toBeNull();
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
      expect(result.items[0]).toBeInstanceOf(CareLogEntryViewModel);
      expect(result.total).toBe(1);
      expect(mockQb.where).toHaveBeenCalledWith('entry.space_id = :spaceId', {
        spaceId: SPACE_ID,
      });
    });

    it('returns empty result when no entries match', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('defaults to performedAt DESC when no sort is given', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'entry.performedAt',
        SortDirection.DESC,
      );
    });

    it('applies a client-supplied sort instead of the default', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [],
          [{ field: 'createdAt', direction: SortDirection.ASC }],
        ),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'entry.createdAt',
        SortDirection.ASC,
      );
    });

    it('applies LIKE filter for notes', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'notes',
              operator: FilterOperator.LIKE,
              value: 'Watered',
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'entry.notes ILIKE :filter0',
        { filter0: '%Watered%' },
      );
    });

    it('applies EQUALS filter for activityType', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'activityType',
              operator: FilterOperator.EQUALS,
              value: CareLogActivityTypeEnum.WATERING,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'entry.activityType = :filter0',
        { filter0: CareLogActivityTypeEnum.WATERING },
      );
    });

    it('applies pagination skip/take from criteria', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, { page: 2, perPage: 5 }),
      );

      expect(mockQb.skip).toHaveBeenCalledWith(5);
      expect(mockQb.take).toHaveBeenCalledWith(5);
    });
  });

  describe('save()', () => {
    it('is a no-op', async () => {
      const vm = mapper.toViewModel(buildEntity());

      await expect(repository.save(vm)).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(ENTRY_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
