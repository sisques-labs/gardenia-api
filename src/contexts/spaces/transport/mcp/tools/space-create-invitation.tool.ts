import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { CreateSpaceInvitationCommand } from '@contexts/spaces/application/commands/create-space-invitation/create-space-invitation.command';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { spaceCreateInvitationSchema } from '../schemas/space-create-invitation.schema';

@McpTool()
@Injectable()
export class SpaceCreateInvitationTool implements IMcpTool {
  private readonly logger = new Logger(SpaceCreateInvitationTool.name);

  readonly name = 'space_create_invitation';
  readonly title = 'Create space invitation';
  readonly description =
    'Creates an invitation to join a space and returns the invitation.';
  readonly inputSchema = spaceCreateInvitationSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { spaceId, role, expiresAt } = args as {
      spaceId: string;
      role?: MembershipRoleEnum;
      expiresAt?: string;
    };
    this.logger.log(`Creating invitation for space: ${spaceId}`);

    const result = await this.commandBus.execute(
      new CreateSpaceInvitationCommand({
        spaceId,
        requestingUserId: context.userId,
        role,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      }),
    );

    return {
      content: [
        { type: 'text', text: JSON.stringify(result ?? { success: true }) },
      ],
    };
  }
}
