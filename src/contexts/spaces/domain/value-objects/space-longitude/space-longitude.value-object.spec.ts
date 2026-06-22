import { SpaceInvalidLongitudeException } from '@contexts/spaces/domain/exceptions/space-invalid-longitude.exception';
import { SpaceLongitudeValueObject } from './space-longitude.value-object';

describe('SpaceLongitudeValueObject', () => {
  it('accepts a longitude within range', () => {
    expect(new SpaceLongitudeValueObject(-3.7038).value).toBe(-3.7038);
  });

  it('accepts the minimum boundary (-180)', () => {
    expect(
      () => new SpaceLongitudeValueObject(SpaceLongitudeValueObject.MIN),
    ).not.toThrow();
  });

  it('accepts the maximum boundary (180)', () => {
    expect(
      () => new SpaceLongitudeValueObject(SpaceLongitudeValueObject.MAX),
    ).not.toThrow();
  });

  it('throws SpaceInvalidLongitudeException below the minimum', () => {
    expect(() => new SpaceLongitudeValueObject(-180.1)).toThrow(
      SpaceInvalidLongitudeException,
    );
  });

  it('throws SpaceInvalidLongitudeException above the maximum', () => {
    expect(() => new SpaceLongitudeValueObject(180.1)).toThrow(
      SpaceInvalidLongitudeException,
    );
  });
});
