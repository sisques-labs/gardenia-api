import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { UpdateCareScheduleCommand } from './update-care-schedule.command';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('UpdateCareScheduleCommand', () => {
  it('leaves all optional fields undefined when only id is provided', () => {
    const command = new UpdateCareScheduleCommand({ id: SCHEDULE_ID });

    expect(command.id.value).toBe(SCHEDULE_ID);
    expect(command.activityType).toBeUndefined();
    expect(command.intervalDays).toBeUndefined();
    expect(command.quantity).toBeUndefined();
    expect(command.unit).toBeUndefined();
    expect(command.notes).toBeUndefined();
    expect(command.active).toBeUndefined();
  });

  it('wraps activityType when provided', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      activityType: CareScheduleActivityTypeEnum.PRUNING,
    });

    expect(command.activityType?.value).toBe(
      CareScheduleActivityTypeEnum.PRUNING,
    );
  });

  it('clears intervalDays when explicitly null', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      intervalDays: null,
    });

    expect(command.intervalDays).toBeNull();
  });

  it('wraps intervalDays when a number is provided', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      intervalDays: 7,
    });

    expect(command.intervalDays?.value).toBe(7);
  });

  it('clears quantity when explicitly null', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      quantity: null,
    });

    expect(command.quantity).toBeNull();
  });

  it('wraps quantity when a number is provided', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      quantity: 100,
    });

    expect(command.quantity?.value).toBe(100);
  });

  it('clears unit when explicitly null', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      unit: null,
    });

    expect(command.unit).toBeNull();
  });

  it('wraps unit when provided', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      unit: CareScheduleUnitEnum.ML,
    });

    expect(command.unit?.value).toBe(CareScheduleUnitEnum.ML);
  });

  it('clears notes when explicitly null', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      notes: null,
    });

    expect(command.notes).toBeNull();
  });

  it('wraps notes when provided', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      notes: 'Updated notes',
    });

    expect(command.notes?.value).toBe('Updated notes');
  });

  it('wraps active when provided', () => {
    const command = new UpdateCareScheduleCommand({
      id: SCHEDULE_ID,
      active: false,
    });

    expect(command.active?.value).toBe(false);
  });
});
