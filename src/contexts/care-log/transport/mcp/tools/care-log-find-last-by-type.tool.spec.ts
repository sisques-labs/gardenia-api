import { QueryBus } from '@nestjs/cqrs';

import { CareLogFindLastByTypeQuery } from '@contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.query';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogFindLastByTypeMcpTool } from './care-log-find-last-by-type.tool';

const PLANT_ID = '11111111-1111-4111-8111-111111111111';

describe('CareLogFindLastByTypeMcpTool', () => {
  let tool: CareLogFindLastByTypeMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new CareLogFindLastByTypeMcpTool(queryBus);
  });

  it('dispatches the query and serializes the result', async () => {
    const viewModel = { id: '22222222-2222-4222-8222-222222222222' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({
      plantId: PLANT_ID,
      activityType: CareLogActivityTypeEnum.WATERING,
    });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(CareLogFindLastByTypeQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as CareLogFindLastByTypeQuery;
    expect(query.plantId.value).toBe(PLANT_ID);
    expect(query.activityType.value).toBe(CareLogActivityTypeEnum.WATERING);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when no entry is found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({
      plantId: PLANT_ID,
      activityType: CareLogActivityTypeEnum.WATERING,
    });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
