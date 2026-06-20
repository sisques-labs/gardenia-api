import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { AcceptSpaceInvitationCommand } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.command';
import { spaceAcceptInvitationSchema } from '../schemas/space-accept-invitation.schema';

@McpTool()
@Injectable()
export class SpaceAcceptInvitationTool implements IMcpTool {
  private readonly logger = new Logger(SpaceAcceptInvitationTool.name);

  readonly name = 'space_accept_invitation';
  readonly title = 'Accept space invitation';
  readonly description =
    'Accepts a space invitation on behalf of the authenticated user.';
  readonly inputSchema = spaceAcceptInvitationSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { code } = args as { code: string };
    this.logger.log(`Accepting invitation for user: ${context.userId}`);

    const result = await this.commandBus.execute(
      new AcceptSpaceInvitationCommand({
        code,
        acceptingUserId: context.userId,
      }),
    );

    return {
      content: [
        { type: 'text', text: JSON.stringify(result ?? { success: true }) },
      ],
    };
  }
}
