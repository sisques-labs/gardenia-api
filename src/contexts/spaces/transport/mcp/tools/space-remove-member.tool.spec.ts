import { CommandBus } from '@nestjs/cqrs';

import { RemoveMemberCommand } from '@contexts/spaces/application/commands/remove-member/remove-member.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { SpaceRemoveMemberMcpTool } from './space-remove-member.tool';

const SPACE_ID = '44444444-4444-4444-8444-444444444444';
const TARGET_USER_ID = '55555555-5555-4555-8555-555555555555';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: SPACE_ID,
};

describe('SpaceRemoveMemberMcpTool', () => {
  let tool: SpaceRemoveMemberMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new SpaceRemoveMemberMcpTool(commandBus);
  });

  it('dispatches RemoveMemberCommand with requestingUserId from the context', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute(
      { spaceId: SPACE_ID, targetUserId: TARGET_USER_ID },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(RemoveMemberCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as RemoveMemberCommand;
    expect(command.spaceId.value).toBe(SPACE_ID);
    expect(command.targetUserId.value).toBe(TARGET_USER_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true }),
    });
  });
});
