import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';
import { SpaceInvalidEnvironmentException } from '@contexts/spaces/domain/exceptions/space-invalid-environment.exception';
import { SpaceEnvironmentValueObject } from './space-environment.value-object';

describe('SpaceEnvironmentValueObject', () => {
  it('accepts every valid enum value', () => {
    for (const value of Object.values(SpaceEnvironmentEnum)) {
      expect(() => new SpaceEnvironmentValueObject(value)).not.toThrow();
      expect(new SpaceEnvironmentValueObject(value).value).toBe(value);
    }
  });

  it('throws SpaceInvalidEnvironmentException for an invalid value', () => {
    expect(
      () => new SpaceEnvironmentValueObject('SPACE' as SpaceEnvironmentEnum),
    ).toThrow(SpaceInvalidEnvironmentException);
  });

  it('supports equality comparison', () => {
    const a = new SpaceEnvironmentValueObject(SpaceEnvironmentEnum.INDOOR);
    const b = new SpaceEnvironmentValueObject(SpaceEnvironmentEnum.INDOOR);

    expect(a.equals(b)).toBe(true);
  });
});
