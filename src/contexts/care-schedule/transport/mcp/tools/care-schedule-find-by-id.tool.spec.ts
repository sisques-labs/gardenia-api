import { QueryBus } from '@nestjs/cqrs';

import { CareScheduleFindByIdQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-id/care-schedule-find-by-id.query';
import { CareScheduleFindByIdMcpTool } from './care-schedule-find-by-id.tool';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('CareScheduleFindByIdMcpTool', () => {
  let tool: CareScheduleFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new CareScheduleFindByIdMcpTool(queryBus);
  });

  it('returns the schedule when found', async () => {
    const schedule = { id: SCHEDULE_ID };
    queryBus.execute.mockResolvedValueOnce(schedule);

    const result = await tool.execute({ id: SCHEDULE_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(CareScheduleFindByIdQuery),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(schedule),
    });
  });

  it('returns null when not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: SCHEDULE_ID });

    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(null),
    });
  });
});
