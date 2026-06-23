import { CommandBus } from '@nestjs/cqrs';

import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { SpaceCreateMcpTool } from './space-create.tool';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('SpaceCreateMcpTool', () => {
  let tool: SpaceCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new SpaceCreateMcpTool(commandBus);
  });

  it('dispatches CreateSpaceCommand with ownerId from the context', async () => {
    commandBus.execute.mockResolvedValueOnce('space-id');

    const result = await tool.execute({ name: 'Backyard' }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateSpaceCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as CreateSpaceCommand;
    expect(command.name.value).toBe('Backyard');
    expect(command.ownerId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: 'space-id' }),
    });
  });
});
