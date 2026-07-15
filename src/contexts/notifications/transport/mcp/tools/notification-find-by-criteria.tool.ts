import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';
import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';

import { NotificationFindByCriteriaQuery } from '@contexts/notifications/application/queries/notification-find-by-criteria/notification-find-by-criteria.query';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { notificationFindByCriteriaSchema } from '../schemas/notification-find-by-criteria.schema';

@McpTool()
@Injectable()
export class NotificationFindByCriteriaMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(NotificationFindByCriteriaMcpTool.name);

  readonly name = 'notification_find_by_criteria';
  readonly title = 'List notifications';
  readonly description =
    "Returns a paginated list of the current user's notifications.";
  readonly inputSchema = notificationFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { status, type, page, perPage } = args as {
      status?: NotificationStatusEnum;
      type?: string;
      page?: number;
      perPage?: number;
    };
    this.logger.log(`Finding notifications for user: ${context.userId}`);

    const filters = [];
    if (status)
      filters.push({
        field: 'status',
        operator: FilterOperator.EQUALS,
        value: status,
      });
    if (type)
      filters.push({
        field: 'type',
        operator: FilterOperator.EQUALS,
        value: type,
      });

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(filters, undefined, pagination);

    const result = await this.queryBus.execute(
      new NotificationFindByCriteriaQuery(context.userId, criteria),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
