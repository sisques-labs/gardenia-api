import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogActivityTypeValueObject } from './care-log-activity-type.value-object';

describe('CareLogActivityTypeValueObject', () => {
  it('accepts every valid enum value', () => {
    for (const value of Object.values(CareLogActivityTypeEnum)) {
      expect(() => new CareLogActivityTypeValueObject(value)).not.toThrow();
      expect(new CareLogActivityTypeValueObject(value).value).toBe(value);
    }
  });

  it('throws for an invalid value', () => {
    expect(
      () =>
        new CareLogActivityTypeValueObject('FLYING' as CareLogActivityTypeEnum),
    ).toThrow();
  });

  it('throws for an empty value', () => {
    expect(
      () => new CareLogActivityTypeValueObject('' as CareLogActivityTypeEnum),
    ).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new CareLogActivityTypeValueObject(
      CareLogActivityTypeEnum.WATERING,
    );
    const b = new CareLogActivityTypeValueObject(
      CareLogActivityTypeEnum.WATERING,
    );

    expect(a.equals(b)).toBe(true);
  });
});
