import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleUnitValueObject } from './care-schedule-unit.value-object';

describe('CareScheduleUnitValueObject', () => {
  it('accepts a valid unit', () => {
    expect(new CareScheduleUnitValueObject(CareScheduleUnitEnum.ML).value).toBe(
      'ML',
    );
  });

  it('rejects an invalid unit', () => {
    expect(
      () => new CareScheduleUnitValueObject('CUPS' as CareScheduleUnitEnum),
    ).toThrow();
  });
});
