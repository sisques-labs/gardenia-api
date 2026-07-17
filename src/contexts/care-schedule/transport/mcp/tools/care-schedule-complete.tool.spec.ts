import { CommandBus } from '@nestjs/cqrs';

import { CompleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.command';
import { CareScheduleCompleteMcpTool } from './care-schedule-complete.tool';

const CARE_SCHEDULE_ID = '11111111-1111-4111-8111-111111111111';

describe('CareScheduleCompleteMcpTool', () => {
  let tool: CareScheduleCompleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareScheduleCompleteMcpTool(commandBus);
  });

  it('dispatches the complete command with a completedAt date when provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({
      id: CARE_SCHEDULE_ID,
      completedAt: '2026-06-20T10:00:00.000Z',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CompleteCareScheduleCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CompleteCareScheduleCommand;
    expect(command.id.value).toBe(CARE_SCHEDULE_ID);
    expect(command.completedAt?.value).toEqual(
      new Date('2026-06-20T10:00:00.000Z'),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: CARE_SCHEDULE_ID }),
    });
  });

  it('dispatches the complete command with a null completedAt when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({ id: CARE_SCHEDULE_ID });

    const command = commandBus.execute.mock
      .calls[0][0] as CompleteCareScheduleCommand;
    expect(command.completedAt).toBeNull();
  });
});
