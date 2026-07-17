import { CommandBus } from '@nestjs/cqrs';

import { CreateSpaceInvitationCommand } from '@contexts/spaces/application/commands/create-space-invitation/create-space-invitation.command';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { SpaceCreateInvitationMcpTool } from './space-create-invitation.tool';

const SPACE_ID = '44444444-4444-4444-8444-444444444444';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: SPACE_ID,
};

describe('SpaceCreateInvitationMcpTool', () => {
  let tool: SpaceCreateInvitationMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new SpaceCreateInvitationMcpTool(commandBus);
  });

  it('dispatches CreateSpaceInvitationCommand with requestingUserId from the context', async () => {
    const viewModel = { code: 'ABC123' };
    commandBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ spaceId: SPACE_ID }, CONTEXT);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateSpaceInvitationCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CreateSpaceInvitationCommand;
    expect(command.spaceId.value).toBe(SPACE_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(command.role.value).toBe(MembershipRoleEnum.MEMBER);
    expect(command.expiresAt).toBeNull();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('forwards an explicit role and expiresAt', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute(
      {
        spaceId: SPACE_ID,
        role: MembershipRoleEnum.OWNER,
        expiresAt: '2026-08-01T00:00:00.000Z',
      },
      CONTEXT,
    );

    const command = commandBus.execute.mock
      .calls[0][0] as CreateSpaceInvitationCommand;
    expect(command.role.value).toBe(MembershipRoleEnum.OWNER);
    expect(command.expiresAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true }),
    });
  });
});
