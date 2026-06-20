import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { RemoveMemberCommand } from '@contexts/spaces/application/commands/remove-member/remove-member.command';
import { spaceRemoveMemberSchema } from '../schemas/space-remove-member.schema';

@McpTool()
@Injectable()
export class SpaceRemoveMemberTool implements IMcpTool {
  private readonly logger = new Logger(SpaceRemoveMemberTool.name);

  readonly name = 'space_remove_member';
  readonly title = 'Remove member from space';
  readonly description = 'Removes a user from a space.';
  readonly inputSchema = spaceRemoveMemberSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
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
