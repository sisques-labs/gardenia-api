import { SpaceInvalidLatitudeException } from '@contexts/spaces/domain/exceptions/space-invalid-latitude.exception';
import { SpaceLatitudeValueObject } from './space-latitude.value-object';

describe('SpaceLatitudeValueObject', () => {
  it('accepts a latitude within range', () => {
    expect(new SpaceLatitudeValueObject(40.4168).value).toBe(40.4168);
  });

  it('accepts the minimum boundary (-90)', () => {
    expect(
      () => new SpaceLatitudeValueObject(SpaceLatitudeValueObject.MIN),
    ).not.toThrow();
  });

  it('accepts the maximum boundary (90)', () => {
    expect(
      () => new SpaceLatitudeValueObject(SpaceLatitudeValueObject.MAX),
    ).not.toThrow();
  });

  it('throws SpaceInvalidLatitudeException below the minimum', () => {
    expect(() => new SpaceLatitudeValueObject(-90.1)).toThrow(
      SpaceInvalidLatitudeException,
    );
  });

  it('throws SpaceInvalidLatitudeException above the maximum', () => {
    expect(() => new SpaceLatitudeValueObject(90.1)).toThrow(
      SpaceInvalidLatitudeException,
    );
  });
});
