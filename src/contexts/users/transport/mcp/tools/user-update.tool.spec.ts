import { CommandBus } from '@nestjs/cqrs';

import { UpdateUserCommand } from '@contexts/users/application/commands/update-user/update-user.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { UserUpdateMcpTool } from './user-update.tool';

const CONTEXT: IMcpToolContext = {
  userId: '22222222-2222-4222-8222-222222222222',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('UserUpdateMcpTool', () => {
  let tool: UserUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new UserUpdateMcpTool(commandBus);
  });

  it('dispatches UpdateUserCommand with id from the context', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute(
      { username: 'newname', firstName: 'Ada', bio: null },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateUserCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as UpdateUserCommand;
    expect(command.id.value).toBe(CONTEXT.userId);
    expect(command.username?.value).toBe('newname');
    expect(command.firstName).toBe('Ada');
    expect(command.bio).toBeNull();
    expect(command.lastName).toBeUndefined();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: CONTEXT.userId }),
    });
  });
});
