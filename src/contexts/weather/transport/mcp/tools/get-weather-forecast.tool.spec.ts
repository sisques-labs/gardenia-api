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

  it('dispatches GetWeatherForecastQuery and serializes the result', async () => {
    const viewModel = { temperature: 18 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ latitude: 40.4, longitude: -3.7 });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GetWeatherForecastQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as GetWeatherForecastQuery;
    expect(query.latitude.value).toBe(40.4);
    expect(query.longitude.value).toBe(-3.7);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when there is no forecast', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ latitude: 40.4, longitude: -3.7 });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
