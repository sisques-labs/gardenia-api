import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleActivityTypeValueObject } from './care-schedule-activity-type.value-object';

describe('CareScheduleActivityTypeValueObject', () => {
  it('accepts a valid activity type', () => {
    expect(
      new CareScheduleActivityTypeValueObject(
        CareScheduleActivityTypeEnum.FERTILIZING,
      ).value,
    ).toBe('FERTILIZING');
  });

  it('rejects an unknown activity type', () => {
    expect(
      () =>
        new CareScheduleActivityTypeValueObject(
          'DANCING' as CareScheduleActivityTypeEnum,
        ),
    ).toThrow();
  });
});
