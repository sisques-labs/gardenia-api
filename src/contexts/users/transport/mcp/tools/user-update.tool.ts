import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { UpdateUserCommand } from '@contexts/users/application/commands/update-user/update-user.command';
import { userUpdateSchema } from '../schemas/user-update.schema';

@McpTool()
@Injectable()
export class UserUpdateMcpTool implements IMcpTool {
  private readonly logger = new Logger(UserUpdateMcpTool.name);

  readonly name = 'user_update';
  readonly title = 'Update my profile';
  readonly description =
    'Updates the authenticated user profile. Only provided fields are changed.';
  readonly inputSchema = userUpdateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { username, firstName, lastName, avatarUrl, bio, locale, timezone } =
      args as {
        username?: string;
        firstName?: string | null;
        lastName?: string | null;
        avatarUrl?: string | null;
        bio?: string | null;
        locale?: string | null;
        timezone?: string | null;
      };
    this.logger.log(`Updating profile for user: ${context.userId}`);

    await this.commandBus.execute(
      new UpdateUserCommand({
        id: context.userId,
        username,
        firstName,
        lastName,
        avatarUrl,
        bio,
        locale,
        timezone,
      }),
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, id: context.userId }),
        },
      ],
    };
  }
}
