import { WeatherLongitudeValueObject } from './weather-longitude.value-object';

describe('WeatherLongitudeValueObject', () => {
  it('wraps a numeric longitude', () => {
    const vo = new WeatherLongitudeValueObject(-3.7038);

    expect(vo.value).toBe(-3.7038);
  });

  it('accepts positive longitudes', () => {
    expect(() => new WeatherLongitudeValueObject(151.2093)).not.toThrow();
  });

  it('accepts zero', () => {
    expect(new WeatherLongitudeValueObject(0).value).toBe(0);
  });

  it('throws for a non-finite value', () => {
    expect(() => new WeatherLongitudeValueObject(-Infinity)).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new WeatherLongitudeValueObject(-3.7038);
    const b = new WeatherLongitudeValueObject(-3.7038);

    expect(a.equals(b)).toBe(true);
  });
});
