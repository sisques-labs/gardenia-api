import { CommandBus } from '@nestjs/cqrs';

import { CompleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.command';
import { CareScheduleCompleteMcpTool } from './care-schedule-complete.tool';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('CareScheduleCompleteMcpTool', () => {
  let tool: CareScheduleCompleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleCompleteMcpTool(commandBus);
  });

  it('dispatches CompleteCareScheduleCommand with a parsed completedAt', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({
      id: SCHEDULE_ID,
      completedAt: '2026-06-27T00:00:00.000Z',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CompleteCareScheduleCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CompleteCareScheduleCommand;
    expect(command.completedAt?.value).toEqual(
      new Date('2026-06-27T00:00:00.000Z'),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: SCHEDULE_ID }),
    });
  });

  it('defaults completedAt when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: SCHEDULE_ID });

    const command = commandBus.execute.mock
      .calls[0][0] as CompleteCareScheduleCommand;
    expect(command.completedAt).toBeNull();
  });
});
