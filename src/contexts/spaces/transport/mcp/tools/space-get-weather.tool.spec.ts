import { QueryBus } from '@nestjs/cqrs';

import { GetSpaceWeatherQuery } from '@contexts/spaces/application/queries/get-space-weather/get-space-weather.query';
import { SpaceGetWeatherMcpTool } from './space-get-weather.tool';

const SPACE_ID = '44444444-4444-4444-8444-444444444444';

describe('SpaceGetWeatherMcpTool', () => {
  let tool: SpaceGetWeatherMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new SpaceGetWeatherMcpTool(queryBus);
  });

  it('dispatches GetSpaceWeatherQuery and serializes the result', async () => {
    const viewModel = { temperature: 21 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ spaceId: SPACE_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GetSpaceWeatherQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as GetSpaceWeatherQuery;
    expect(query.spaceId.value).toBe(SPACE_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when there is no result', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ spaceId: SPACE_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
