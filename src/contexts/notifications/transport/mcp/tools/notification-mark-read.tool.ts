import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';

import { MarkNotificationReadCommand } from '@contexts/notifications/application/commands/mark-notification-read/mark-notification-read.command';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { notificationMarkReadSchema } from '../schemas/notification-mark-read.schema';

@McpTool()
@Injectable()
export class NotificationMarkReadMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(NotificationMarkReadMcpTool.name);

  readonly name = 'notification_mark_read';
  readonly title = 'Mark notification as read';
  readonly description = 'Marks a single notification as read.';
  readonly inputSchema = notificationMarkReadSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(
      `Marking notification read: ${id} for user: ${context.userId}`,
    );

    await this.commandBus.execute(
      new MarkNotificationReadCommand({
        notificationId: id,
        userId: context.userId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
