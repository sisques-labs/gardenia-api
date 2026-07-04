import { CommandBus } from '@nestjs/cqrs';

import { DeleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.command';
import { CareScheduleDeleteMcpTool } from './care-schedule-delete.tool';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('CareScheduleDeleteMcpTool', () => {
  let tool: CareScheduleDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleDeleteMcpTool(commandBus);
  });

  it('dispatches DeleteCareScheduleCommand', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: SCHEDULE_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteCareScheduleCommand),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: SCHEDULE_ID }),
    });
  });
});
