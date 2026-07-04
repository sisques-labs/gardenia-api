import { CareScheduleActiveValueObject } from './care-schedule-active.value-object';

describe('CareScheduleActiveValueObject', () => {
  it('wraps a boolean value', () => {
    expect(new CareScheduleActiveValueObject(true).value).toBe(true);
    expect(new CareScheduleActiveValueObject(false).value).toBe(false);
  });
});
