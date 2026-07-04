import { QueryBus } from '@nestjs/cqrs';

import { GetWeatherForecastQuery } from '@contexts/weather/application/queries/get-weather-forecast/get-weather-forecast.query';
import { GetWeatherForecastMcpTool } from './get-weather-forecast.tool';

describe('GetWeatherForecastMcpTool', () => {
  let tool: GetWeatherForecastMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new GetWeatherForecastMcpTool(queryBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('weather_get_forecast');
    expect(tool.inputSchema).toHaveProperty('latitude');
    expect(tool.inputSchema).toHaveProperty('longitude');
  });

  it('dispatches GetWeatherForecastQuery and serializes the result', async () => {
    const forecast = { daily: [] };
    queryBus.execute.mockResolvedValueOnce(forecast);

    const result = await tool.execute({
      latitude: 40.4168,
      longitude: -3.7038,
    });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GetWeatherForecastQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as GetWeatherForecastQuery;
    expect(query.latitude.value).toBe(40.4168);
    expect(query.longitude.value).toBe(-3.7038);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(forecast),
    });
  });

  it('serializes null when no forecast is returned', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ latitude: 1, longitude: 2 });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
