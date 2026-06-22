import { IWeatherPort } from '@contexts/weather/application/ports/weather.port';
import { IWeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';
import { GetWeatherForecastQuery } from './get-weather-forecast.query';
import { GetWeatherForecastQueryHandler } from './get-weather-forecast.handler';

const LAT = 40.4168;
const LON = -3.7038;

describe('GetWeatherForecastQueryHandler', () => {
  let handler: GetWeatherForecastQueryHandler;
  let weatherPort: jest.Mocked<IWeatherPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    weatherPort = {
      getForecast: jest.fn(),
    } as unknown as jest.Mocked<IWeatherPort>;
    handler = new GetWeatherForecastQueryHandler(weatherPort);
  });

  it('delegates to the weather port with the raw lat/lon and returns the forecast', async () => {
    const forecast = { daily: [] } as unknown as IWeatherForecast;
    weatherPort.getForecast.mockResolvedValue(forecast);

    const result = await handler.execute(
      new GetWeatherForecastQuery({ latitude: LAT, longitude: LON }),
    );

    expect(weatherPort.getForecast).toHaveBeenCalledWith(LAT, LON);
    expect(result).toBe(forecast);
  });

  it('propagates errors from the weather port', async () => {
    weatherPort.getForecast.mockRejectedValue(new Error('upstream error'));

    await expect(
      handler.execute(
        new GetWeatherForecastQuery({ latitude: LAT, longitude: LON }),
      ),
    ).rejects.toThrow('upstream error');
  });
});
