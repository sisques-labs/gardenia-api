import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { AddMemberCommand } from '@contexts/spaces/application/commands/add-member/add-member.command';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { spaceAddMemberSchema } from '../schemas/space-add-member.schema';

@McpTool()
@Injectable()
export class SpaceAddMemberMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(SpaceAddMemberMcpTool.name);

  readonly name = 'space_add_member';
  readonly title = 'Add member to space';
  readonly description = 'Adds a user as a member of a space.';
  readonly inputSchema = spaceAddMemberSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { spaceId, targetUserId, role } = args as {
      spaceId: string;
      targetUserId: string;
      role?: MembershipRoleEnum;
    };
    this.logger.log(`Adding member ${targetUserId} to space ${spaceId}`);

    await this.commandBus.execute(
      new AddMemberCommand({
        spaceId,
        requestingUserId: context.userId,
        targetUserId,
        role,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    };
  }
}
