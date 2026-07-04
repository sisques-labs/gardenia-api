import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CreateCareScheduleCommand } from './create-care-schedule.command';

const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('CreateCareScheduleCommand', () => {
  it('wraps required fields and defaults optionals to null', () => {
    const command = new CreateCareScheduleCommand({
      plantId: PLANT_ID,
      activityType: CareScheduleActivityTypeEnum.WATERING,
      userId: USER_ID,
      spaceId: SPACE_ID,
    });

    expect(command.plantId.value).toBe(PLANT_ID);
    expect(command.activityType.value).toBe(
      CareScheduleActivityTypeEnum.WATERING,
    );
    expect(command.intervalDays).toBeNull();
    expect(command.quantity).toBeNull();
    expect(command.unit).toBeNull();
    expect(command.notes).toBeNull();
    expect(command.nextDueAt).toBeNull();
    expect(command.active).toBeNull();
  });

  it('wraps all optional fields when provided', () => {
    const nextDueAt = new Date('2026-07-05T00:00:00.000Z');
    const command = new CreateCareScheduleCommand({
      plantId: PLANT_ID,
      activityType: CareScheduleActivityTypeEnum.FERTILIZING,
      userId: USER_ID,
      spaceId: SPACE_ID,
      intervalDays: 7,
      quantity: 250,
      unit: CareScheduleUnitEnum.ML,
      notes: 'Deep watering',
      nextDueAt,
      active: false,
    });

    expect(command.intervalDays?.value).toBe(7);
    expect(command.quantity?.value).toBe(250);
    expect(command.unit?.value).toBe(CareScheduleUnitEnum.ML);
    expect(command.notes?.value).toBe('Deep watering');
    expect(command.nextDueAt?.value).toBe(nextDueAt);
    expect(command.active?.value).toBe(false);
  });

  it('treats intervalDays=null explicitly as null (one-time schedule)', () => {
    const command = new CreateCareScheduleCommand({
      plantId: PLANT_ID,
      activityType: CareScheduleActivityTypeEnum.WATERING,
      userId: USER_ID,
      spaceId: SPACE_ID,
      intervalDays: null,
    });

    expect(command.intervalDays).toBeNull();
  });

  it('treats quantity=null explicitly as null', () => {
    const command = new CreateCareScheduleCommand({
      plantId: PLANT_ID,
      activityType: CareScheduleActivityTypeEnum.WATERING,
      userId: USER_ID,
      spaceId: SPACE_ID,
      quantity: null,
    });

    expect(command.quantity).toBeNull();
  });

  it('treats active=false explicitly (not defaulted to null)', () => {
    const command = new CreateCareScheduleCommand({
      plantId: PLANT_ID,
      activityType: CareScheduleActivityTypeEnum.WATERING,
      userId: USER_ID,
      spaceId: SPACE_ID,
      active: false,
    });

    expect(command.active?.value).toBe(false);
  });
});
