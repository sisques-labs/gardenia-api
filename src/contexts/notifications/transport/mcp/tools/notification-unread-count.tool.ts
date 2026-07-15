import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';

import { NotificationsUnreadCountQuery } from '@contexts/notifications/application/queries/notifications-unread-count/notifications-unread-count.query';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';

@McpTool()
@Injectable()
export class NotificationUnreadCountMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(NotificationUnreadCountMcpTool.name);

  readonly name = 'notification_unread_count';
  readonly title = 'Count unread notifications';
  readonly description =
    "Returns the current user's unread notification count.";
  readonly inputSchema = {};

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    _args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    this.logger.log(
      `Counting unread notifications for user: ${context.userId}`,
    );

    const count = await this.queryBus.execute(
      new NotificationsUnreadCountQuery(context.userId),
    );

    return { content: [{ type: 'text', text: JSON.stringify({ count }) }] };
  }
}
