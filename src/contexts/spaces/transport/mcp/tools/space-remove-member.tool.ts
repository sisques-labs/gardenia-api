import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IGardeniaMcpToolContext } from '@core/mcp/gardenia-mcp-context.interface';
import { RemoveMemberCommand } from '@contexts/spaces/application/commands/remove-member/remove-member.command';
import { spaceRemoveMemberSchema } from '../schemas/space-remove-member.schema';

@McpTool()
@Injectable()
export class SpaceRemoveMemberMcpTool implements IMcpTool<IGardeniaMcpToolContext> {
  private readonly logger = new Logger(SpaceRemoveMemberMcpTool.name);

  readonly name = 'space_remove_member';
  readonly title = 'Remove member from space';
  readonly description = 'Removes a user from a space.';
  readonly inputSchema = spaceRemoveMemberSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IGardeniaMcpToolContext,
  ): Promise<CallToolResult> {
    const { spaceId, targetUserId } = args as {
      spaceId: string;
      targetUserId: string;
    };
    this.logger.log(`Removing member ${targetUserId} from space ${spaceId}`);

    await this.commandBus.execute(
      new RemoveMemberCommand({
        spaceId,
        requestingUserId: context.userId,
        targetUserId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    };
  }
}
