import { CommandBus } from '@nestjs/cqrs';

import { DeleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.command';
import { CareScheduleDeleteMcpTool } from './care-schedule-delete.tool';

const CARE_SCHEDULE_ID = '11111111-1111-4111-8111-111111111111';

describe('CareScheduleDeleteMcpTool', () => {
  let tool: CareScheduleDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleDeleteMcpTool(commandBus);
  });

  it('dispatches the delete command', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: CARE_SCHEDULE_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteCareScheduleCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as DeleteCareScheduleCommand;
    expect(command.id.value).toBe(CARE_SCHEDULE_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: CARE_SCHEDULE_ID }),
    });
  });
});
