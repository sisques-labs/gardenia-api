import { WeatherLatitudeValueObject } from './weather-latitude.value-object';

describe('WeatherLatitudeValueObject', () => {
  it('wraps a numeric latitude', () => {
    const vo = new WeatherLatitudeValueObject(40.4168);

    expect(vo.value).toBe(40.4168);
  });

  it('accepts negative latitudes', () => {
    expect(() => new WeatherLatitudeValueObject(-33.8688)).not.toThrow();
  });

  it('accepts zero', () => {
    expect(new WeatherLatitudeValueObject(0).value).toBe(0);
  });

  it('throws for a non-finite value', () => {
    expect(() => new WeatherLatitudeValueObject(Infinity)).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new WeatherLatitudeValueObject(40.4168);
    const b = new WeatherLatitudeValueObject(40.4168);

    expect(a.equals(b)).toBe(true);
  });
});
