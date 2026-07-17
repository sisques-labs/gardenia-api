import {
  Criteria,
  FilterOperator,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleTypeOrmEntity } from '../entities/care-schedule.entity';
import { CareScheduleTypeOrmMapper } from '../mappers/care-schedule-typeorm.mapper';
import { CareScheduleTypeOrmReadRepository } from './care-schedule-typeorm-read.repository';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<CareScheduleTypeOrmEntity> = {},
): CareScheduleTypeOrmEntity => {
  const e = new CareScheduleTypeOrmEntity();
  e.id = SCHEDULE_ID;
  e.plantId = PLANT_ID;
  e.activityType = CareScheduleActivityTypeEnum.FERTILIZING;
  e.intervalDays = 14;
  e.quantity = '250.000';
  e.unit = CareScheduleUnitEnum.ML;
  e.notes = 'Liquid feed';
  e.nextDueAt = new Date('2026-07-01');
  e.lastCompletedAt = null;
  e.active = true;
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

describe('CareScheduleTypeOrmReadRepository', () => {
  let repository: CareScheduleTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<CareScheduleTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<CareScheduleTypeOrmEntity>,
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
      | 'getManyAndCount'
    >
  >;
  let mapper: CareScheduleTypeOrmMapper;

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
    } as unknown as jest.Mocked<Repository<CareScheduleTypeOrmEntity>>;

    mapper = new CareScheduleTypeOrmMapper(new CareScheduleBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new CareScheduleTypeOrmReadRepository(
      rawRepo,
      mapper,
      spaceContext,
    );
  });

  describe('findById()', () => {
    it('returns CareScheduleViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(SCHEDULE_ID);

      expect(result).toBeInstanceOf(CareScheduleViewModel);
      expect(result!.id).toBe(SCHEDULE_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

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
      expect(result.items[0]).toBeInstanceOf(CareScheduleViewModel);
      expect(result.total).toBe(1);
      expect(mockQb.where).toHaveBeenCalledWith(
        'schedule.space_id = :spaceId',
        {
          spaceId: SPACE_ID,
        },
      );
    });

    it('returns empty result when no schedules match', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('defaults to nextDueAt ASC when no sort is given', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'schedule.nextDueAt',
        SortDirection.ASC,
      );
    });

    it('applies a client-supplied sort instead of the default', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [],
          [{ field: 'createdAt', direction: SortDirection.DESC }],
        ),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'schedule.createdAt',
        SortDirection.DESC,
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
              value: CareScheduleActivityTypeEnum.FERTILIZING,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'schedule.activityType = :filter0',
        { filter0: CareScheduleActivityTypeEnum.FERTILIZING },
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
              value: 'feed',
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'schedule.notes ILIKE :filter0',
        { filter0: '%feed%' },
      );
    });

    it('applies the custom due_before filter as next_due_at <=', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      const dueBefore = new Date('2026-07-15');

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'due_before',
              operator: FilterOperator.LESS_THAN_OR_EQUAL,
              value: dueBefore,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'schedule.next_due_at <= :dueBefore',
        { dueBefore },
      );
    });

    it('applies pagination skip/take from criteria', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, { page: 3, perPage: 5 }),
      );

      expect(mockQb.skip).toHaveBeenCalledWith(10);
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

      await repository.delete(SCHEDULE_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
