import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { CreateCareScheduleCommand } from '@contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.command';
import { UpdateCareScheduleCommand } from '@contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.command';
import { CompleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.command';
import { DeleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.command';
import { CareScheduleFindByCriteriaQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-criteria/care-schedule-find-by-criteria.query';
import { CareScheduleFindByIdQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-id/care-schedule-find-by-id.query';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleRestMapper } from '../mappers/care-schedule/care-schedule.mapper';
import { CareSchedulesController } from './care-schedules.controller';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const user = { userId: USER_ID } as CurrentUserPayload;

const now = new Date('2026-06-27T00:00:00.000Z');
const buildVm = (): CareScheduleViewModel =>
  new CareScheduleViewModel({
    id: SCHEDULE_ID,
    plantId: PLANT_ID,
    activityType: CareScheduleActivityTypeEnum.WATERING,
    intervalDays: 3,
    quantity: null,
    unit: null,
    notes: null,
    nextDueAt: now,
    lastCompletedAt: null,
    active: true,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: now,
    updatedAt: now,
  });

describe('CareSchedulesController', () => {
  let controller: CareSchedulesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<CareScheduleRestMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponse: jest.fn(),
    } as unknown as jest.Mocked<CareScheduleRestMapper>;

    controller = new CareSchedulesController(commandBus, queryBus, mapper);
  });

  describe('createCareSchedule()', () => {
    it('dispatches CreateCareScheduleCommand then fetches and maps the created schedule', async () => {
      commandBus.execute.mockResolvedValueOnce(SCHEDULE_ID);
      const vm = buildVm();
      queryBus.execute.mockResolvedValueOnce(vm);
      mapper.toResponse.mockReturnValueOnce({ id: SCHEDULE_ID } as any);

      const result = await controller.createCareSchedule(
        {
          plantId: PLANT_ID,
          activityType: CareScheduleActivityTypeEnum.WATERING,
          intervalDays: 3,
        } as any,
        user,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateCareScheduleCommand),
      );
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(CareScheduleFindByIdQuery),
      );
      expect(result).toEqual({ id: SCHEDULE_ID });
    });
  });

  describe('careSchedulesFindByCriteria()', () => {
    it('lists with no filters and no pagination', async () => {
      queryBus.execute.mockResolvedValueOnce(
        new PaginatedResult<CareScheduleViewModel>([], 0, 1, 20),
      );

      const result = await controller.careSchedulesFindByCriteria();

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(CareScheduleFindByCriteriaQuery),
      );
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('applies all filters and pagination params', async () => {
      const vm = buildVm();
      queryBus.execute.mockResolvedValueOnce(
        new PaginatedResult<CareScheduleViewModel>([vm], 1, 2, 10),
      );
      mapper.toResponse.mockReturnValueOnce({ id: SCHEDULE_ID } as any);

      const result = await controller.careSchedulesFindByCriteria(
        PLANT_ID,
        CareScheduleActivityTypeEnum.WATERING,
        'true',
        '2026-07-05T00:00:00.000Z',
        '2',
        '10',
      );

      const dispatchedQuery = queryBus.execute.mock
        .calls[0][0] as CareScheduleFindByCriteriaQuery;
      expect(dispatchedQuery.criteria.filters).toHaveLength(4);
      expect(result.items).toEqual([{ id: SCHEDULE_ID }]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
    });

    it('treats active=false correctly (still includes filter)', async () => {
      queryBus.execute.mockResolvedValueOnce(
        new PaginatedResult<CareScheduleViewModel>([], 0, 1, 20),
      );

      await controller.careSchedulesFindByCriteria(
        undefined,
        undefined,
        'false',
      );

      const dispatchedQuery = queryBus.execute.mock
        .calls[0][0] as CareScheduleFindByCriteriaQuery;
      const activeFilter = dispatchedQuery.criteria.filters.find(
        (f) => f.field === 'active',
      );
      expect(activeFilter?.value).toBe(false);
    });
  });

  describe('careScheduleFindById()', () => {
    it('dispatches CareScheduleFindByIdQuery and maps the response', async () => {
      const vm = buildVm();
      queryBus.execute.mockResolvedValueOnce(vm);
      mapper.toResponse.mockReturnValueOnce({ id: SCHEDULE_ID } as any);

      const result = await controller.careScheduleFindById(SCHEDULE_ID);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(CareScheduleFindByIdQuery),
      );
      expect(result).toEqual({ id: SCHEDULE_ID });
    });
  });

  describe('updateCareSchedule()', () => {
    it('dispatches UpdateCareScheduleCommand then refetches and maps', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      const vm = buildVm();
      queryBus.execute.mockResolvedValueOnce(vm);
      mapper.toResponse.mockReturnValueOnce({ id: SCHEDULE_ID } as any);

      const result = await controller.updateCareSchedule(SCHEDULE_ID, {
        intervalDays: 7,
      } as any);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateCareScheduleCommand),
      );
      expect(result).toEqual({ id: SCHEDULE_ID });
    });
  });

  describe('completeCareSchedule()', () => {
    it('dispatches CompleteCareScheduleCommand then refetches and maps', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      const vm = buildVm();
      queryBus.execute.mockResolvedValueOnce(vm);
      mapper.toResponse.mockReturnValueOnce({ id: SCHEDULE_ID } as any);

      const result = await controller.completeCareSchedule(SCHEDULE_ID, {
        completedAt: now,
      } as any);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CompleteCareScheduleCommand),
      );
      expect(result).toEqual({ id: SCHEDULE_ID });
    });
  });

  describe('deleteCareSchedule()', () => {
    it('dispatches DeleteCareScheduleCommand and returns success', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);

      const result = await controller.deleteCareSchedule(SCHEDULE_ID);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteCareScheduleCommand),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
