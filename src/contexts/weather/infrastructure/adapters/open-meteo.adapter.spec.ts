import { OpenMeteoAdapter } from './open-meteo.adapter';

const LAT = 40.4168;
const LON = -3.7038;

const rawResponse = () => ({
  latitude: LAT,
  longitude: LON,
  timezone: 'Europe/Madrid',
  daily: {
    time: ['2026-06-22', '2026-06-23'],
    temperature_2m_max: [30, 31],
    temperature_2m_min: [18, 19],
    precipitation_sum: [0, 2.5],
    weathercode: [1, 61],
  },
});

const okResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
  }) as unknown as Response;

describe('OpenMeteoAdapter', () => {
  let adapter: OpenMeteoAdapter;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    adapter = new OpenMeteoAdapter();
    fetchMock = jest.fn().mockResolvedValue(okResponse(rawResponse()));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('maps the Open-Meteo response into a weather forecast', async () => {
    const forecast = await adapter.getForecast(LAT, LON);

    expect(forecast.latitude).toBe(LAT);
    expect(forecast.timezone).toBe('Europe/Madrid');
    expect(forecast.daily).toHaveLength(2);
    expect(forecast.daily[0]).toEqual({
      date: '2026-06-22',
      temperatureMin: 18,
      temperatureMax: 30,
      precipitationSum: 0,
      weatherCode: 1,
    });
  });

  it('caches results and does not hit the network on the second call', async () => {
    await adapter.getForecast(LAT, LON);
    await adapter.getForecast(LAT, LON);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the response is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    } as Response);

    await expect(adapter.getForecast(1, 2)).rejects.toThrow(
      'Open-Meteo request failed: 500 Server Error',
    );
  });
});
