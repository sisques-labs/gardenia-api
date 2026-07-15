import { CommandBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { ICareLogPort } from '@contexts/care-schedule/application/ports/care-log.port';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { ICareScheduleReadRepository } from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';

import { WaterPlantCommand } from './water-plant.command';
import { WaterPlantCommandHandler } from './water-plant.handler';

const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2026-06-27T00:00:00.000Z');

function buildScheduleViewModel(): CareScheduleViewModel {
  return new CareScheduleViewModel({
    id: SCHEDULE_ID,
    plantId: PLANT_ID,
    activityType: CareScheduleActivityTypeEnum.WATERING,
    intervalDays: 3,
    quantity: null,
    unit: null,
    notes: null,
    nextDueAt: NOW,
    lastCompletedAt: null,
    active: true,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('WaterPlantCommandHandler', () => {
  let handler: WaterPlantCommandHandler;
  let mockReadRepo: jest.Mocked<ICareScheduleReadRepository>;
  let mockCareLogPort: jest.Mocked<ICareLogPort>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    mockReadRepo = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICareScheduleReadRepository>;

    mockCareLogPort = {
      recordCareLogEntry: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<ICareLogPort>;

    mockCommandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;

    handler = new WaterPlantCommandHandler(
      mockReadRepo,
      mockCareLogPort,
      mockCommandBus,
    );
  });

  it('completes the active WATERING care schedule when one exists', async () => {
    const schedule = buildScheduleViewModel();
    mockReadRepo.findByCriteria.mockResolvedValue(
      new PaginatedResult([schedule], 1, 1, 1),
    );

    const result = await handler.execute(
      new WaterPlantCommand({
        plantId: PLANT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
        performedAt: NOW,
      }),
    );

    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    const dispatched = mockCommandBus.execute.mock.calls[0][0] as {
      id: { value: string };
      completedAt: { value: Date } | null;
    };
    expect(dispatched.id.value).toBe(SCHEDULE_ID);
    expect(dispatched.completedAt?.value).toEqual(NOW);
    expect(mockCareLogPort.recordCareLogEntry).not.toHaveBeenCalled();
    expect(result).toEqual({
      plantId: PLANT_ID,
      mode: 'SCHEDULE_COMPLETED',
      careScheduleId: SCHEDULE_ID,
    });
  });

  it('records an ad-hoc care-log entry when no active WATERING schedule exists', async () => {
    mockReadRepo.findByCriteria.mockResolvedValue(
      new PaginatedResult([], 0, 1, 1),
    );

    const result = await handler.execute(
      new WaterPlantCommand({
        plantId: PLANT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
        performedAt: NOW,
      }),
    );

    expect(mockCommandBus.execute).not.toHaveBeenCalled();
    expect(mockCareLogPort.recordCareLogEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        plantId: PLANT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
        activityType: 'WATERING',
        performedAt: NOW,
      }),
    );
    expect(result).toEqual({
      plantId: PLANT_ID,
      mode: 'CARE_LOG_CREATED',
    });
  });

  it('defaults performedAt to now when not provided', async () => {
    mockReadRepo.findByCriteria.mockResolvedValue(
      new PaginatedResult([], 0, 1, 1),
    );

    const before = Date.now();
    await handler.execute(
      new WaterPlantCommand({
        plantId: PLANT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
      }),
    );
    const after = Date.now();

    const call = mockCareLogPort.recordCareLogEntry.mock.calls[0][0];
    expect(call.performedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(call.performedAt.getTime()).toBeLessThanOrEqual(after);
  });
});
