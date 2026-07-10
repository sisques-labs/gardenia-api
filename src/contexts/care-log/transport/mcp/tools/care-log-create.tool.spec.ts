import { CommandBus } from '@nestjs/cqrs';

import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CareLogCreateMcpTool } from './care-log-create.tool';

const PLANT_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('CareLogCreateMcpTool', () => {
  let tool: CareLogCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareLogCreateMcpTool(commandBus);
  });

  it('dispatches the command with userId and spaceId from the context', async () => {
    commandBus.execute.mockResolvedValueOnce('entry-id');

    const result = await tool.execute(
      {
        plantId: PLANT_ID,
        activityType: CareLogActivityTypeEnum.WATERING,
        performedAt: '2026-06-20T10:00:00.000Z',
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateCareLogEntryCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CreateCareLogEntryCommand;
    expect(command.plantId.value).toBe(PLANT_ID);
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: 'entry-id' }),
    });
  });
});
