import { CareScheduleIntervalDaysValueObject } from './care-schedule-interval-days.value-object';

describe('CareScheduleIntervalDaysValueObject', () => {
  it('accepts a positive interval', () => {
    expect(new CareScheduleIntervalDaysValueObject(3).value).toBe(3);
  });

  it('rejects zero', () => {
    expect(() => new CareScheduleIntervalDaysValueObject(0)).toThrow();
  });

  it('rejects a negative interval', () => {
    expect(() => new CareScheduleIntervalDaysValueObject(-1)).toThrow();
  });
});
