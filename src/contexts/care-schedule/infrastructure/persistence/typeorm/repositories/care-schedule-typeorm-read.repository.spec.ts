import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
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
  e.activityType = CareScheduleActivityTypeEnum.WATERING;
  e.intervalDays = 3;
  e.quantity = null;
  e.unit = null;
  e.notes = null;
  e.nextDueAt = new Date('2026-07-01T00:00:00.000Z');
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
      'where' | 'andWhere' | 'orderBy' | 'skip' | 'take' | 'getManyAndCount'
    >
  >;
  let mapper: CareScheduleTypeOrmMapper;
  let spaceContext: { require: jest.Mock };

  beforeEach(() => {
    mockQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as any;

    rawRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<CareScheduleTypeOrmEntity>>;

    mapper = new CareScheduleTypeOrmMapper(new CareScheduleBuilder());

    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    };

    repository = new CareScheduleTypeOrmReadRepository(
      rawRepo,
      mapper,
      spaceContext as any,
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
    it('returns paginated results with view models and scopes by space', async () => {
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
        { spaceId: SPACE_ID },
      );
      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'schedule.next_due_at',
        'ASC',
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

    it('applies the cross-field due_before filter', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      const dueBefore = new Date('2026-07-05T00:00:00.000Z');

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

    it('applies LIKE filter for a text field', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [{ field: 'notes', operator: FilterOperator.LIKE, value: 'Deep' }],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'LOWER(schedule.notes) LIKE :notes',
        { notes: '%deep%' },
      );
    });

    it('applies EQUALS filter for a field', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'plant_id',
              operator: FilterOperator.EQUALS,
              value: PLANT_ID,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'schedule.plant_id = :plant_id',
        { plant_id: PLANT_ID },
      );
    });

    it('applies GREATER_THAN_OR_EQUAL filter for a field', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      const from = new Date('2026-01-01');

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'next_due_at',
              operator: FilterOperator.GREATER_THAN_OR_EQUAL,
              value: from,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'schedule.next_due_at >= :next_due_atFrom',
        { next_due_atFrom: from },
      );
    });

    it('applies LESS_THAN_OR_EQUAL filter for a field', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      const to = new Date('2026-12-31');

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'next_due_at',
              operator: FilterOperator.LESS_THAN_OR_EQUAL,
              value: to,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'schedule.next_due_at <= :next_due_atTo',
        { next_due_atTo: to },
      );
    });
  });

  describe('save()', () => {
    it('resolves without doing anything (view-model side has no direct write)', async () => {
      await expect(
        repository.save({ id: SCHEDULE_ID } as CareScheduleViewModel),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(SCHEDULE_ID);

      expect(rawRepo.delete).toHaveBeenCalledWith({
        id: SCHEDULE_ID,
        spaceId: SPACE_ID,
      });
    });
  });
});
