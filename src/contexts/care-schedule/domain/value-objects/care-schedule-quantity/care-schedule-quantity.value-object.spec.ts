import { CareScheduleQuantityValueObject } from './care-schedule-quantity.value-object';

describe('CareScheduleQuantityValueObject', () => {
  it('accepts a positive quantity', () => {
    expect(new CareScheduleQuantityValueObject(250).value).toBe(250);
  });

  it('rejects zero', () => {
    expect(() => new CareScheduleQuantityValueObject(0)).toThrow();
  });
});
