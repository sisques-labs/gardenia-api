import { CareScheduleDueWindowHoursValueObject } from './care-schedule-due-window-hours.value-object';

describe('CareScheduleDueWindowHoursValueObject', () => {
  it('accepts a positive window', () => {
    expect(new CareScheduleDueWindowHoursValueObject(24).value).toBe(24);
  });

  it('rejects zero', () => {
    expect(() => new CareScheduleDueWindowHoursValueObject(0)).toThrow();
  });

  it('rejects a negative window', () => {
    expect(() => new CareScheduleDueWindowHoursValueObject(-1)).toThrow();
  });
});
