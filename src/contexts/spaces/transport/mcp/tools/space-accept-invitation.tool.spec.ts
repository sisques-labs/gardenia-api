import { CommandBus } from '@nestjs/cqrs';

import { AcceptSpaceInvitationCommand } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { SpaceAcceptInvitationMcpTool } from './space-accept-invitation.tool';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('SpaceAcceptInvitationMcpTool', () => {
  let tool: SpaceAcceptInvitationMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new SpaceAcceptInvitationMcpTool(commandBus);
  });

  it('dispatches AcceptSpaceInvitationCommand with acceptingUserId from the context', async () => {
    const viewModel = { id: '44444444-4444-4444-8444-444444444444' };
    commandBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ code: 'ABC123' }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(AcceptSpaceInvitationCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as AcceptSpaceInvitationCommand;
    expect(command.code.value).toBe('ABC123');
    expect(command.acceptingUserId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes success fallback when the command returns nothing', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ code: 'ABC123' }, CONTEXT);

    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true }),
    });
  });
});
