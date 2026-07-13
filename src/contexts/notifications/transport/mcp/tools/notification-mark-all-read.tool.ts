import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';

import { MarkAllNotificationsReadCommand } from '@contexts/notifications/application/commands/mark-all-notifications-read/mark-all-notifications-read.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';

@McpTool()
@Injectable()
export class NotificationMarkAllReadMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(NotificationMarkAllReadMcpTool.name);

  readonly name = 'notification_mark_all_read';
  readonly title = 'Mark all notifications as read';
  readonly description =
    "Marks all of the current user's notifications as read.";
  readonly inputSchema = {};

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    _args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    this.logger.log(
      `Marking all notifications read for user: ${context.userId}`,
    );

    await this.commandBus.execute(
      new MarkAllNotificationsReadCommand(context.userId),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    };
  }
}
