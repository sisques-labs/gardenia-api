import { CommandBus } from '@nestjs/cqrs';

import { AddMemberCommand } from '@contexts/spaces/application/commands/add-member/add-member.command';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { SpaceAddMemberMcpTool } from './space-add-member.tool';

const SPACE_ID = '44444444-4444-4444-8444-444444444444';
const TARGET_USER_ID = '55555555-5555-4555-8555-555555555555';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: SPACE_ID,
};

describe('SpaceAddMemberMcpTool', () => {
  let tool: SpaceAddMemberMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new SpaceAddMemberMcpTool(commandBus);
  });

  it('dispatches AddMemberCommand with requestingUserId from the context', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute(
      { spaceId: SPACE_ID, targetUserId: TARGET_USER_ID },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(AddMemberCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as AddMemberCommand;
    expect(command.spaceId.value).toBe(SPACE_ID);
    expect(command.targetUserId.value).toBe(TARGET_USER_ID);
    expect(command.requestingUserId.value).toBe(CONTEXT.userId);
    expect(command.role.value).toBe(MembershipRoleEnum.MEMBER);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true }),
    });
  });

  it('forwards an explicit role', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute(
      {
        spaceId: SPACE_ID,
        targetUserId: TARGET_USER_ID,
        role: MembershipRoleEnum.OWNER,
      },
      CONTEXT,
    );

    const command = commandBus.execute.mock.calls[0][0] as AddMemberCommand;
    expect(command.role.value).toBe(MembershipRoleEnum.OWNER);
  });
});
