import { QueryBus } from '@nestjs/cqrs';

import { CareScheduleFindByIdQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-id/care-schedule-find-by-id.query';
import { CareScheduleFindByIdMcpTool } from './care-schedule-find-by-id.tool';

const CARE_SCHEDULE_ID = '11111111-1111-4111-8111-111111111111';

describe('CareScheduleFindByIdMcpTool', () => {
  let tool: CareScheduleFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new CareScheduleFindByIdMcpTool(queryBus);
  });

  it('dispatches CareScheduleFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: CARE_SCHEDULE_ID, activityType: 'WATERING' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: CARE_SCHEDULE_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(CareScheduleFindByIdQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as CareScheduleFindByIdQuery;
    expect(query.id.value).toBe(CARE_SCHEDULE_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the care schedule is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: CARE_SCHEDULE_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
