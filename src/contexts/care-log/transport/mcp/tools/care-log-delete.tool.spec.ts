import { CommandBus } from '@nestjs/cqrs';

import { DeleteCareLogEntryCommand } from '@contexts/care-log/application/commands/delete-care-log-entry/delete-care-log-entry.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CareLogDeleteMcpTool } from './care-log-delete.tool';

const CARE_LOG_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('CareLogDeleteMcpTool', () => {
  let tool: CareLogDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new CareLogDeleteMcpTool(commandBus);
  });

  it('dispatches the delete command with the requesting user from the context', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: CARE_LOG_ID }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteCareLogEntryCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as DeleteCareLogEntryCommand;
    expect(command.id.value).toBe(CARE_LOG_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: CARE_LOG_ID }),
    });
  });
});
