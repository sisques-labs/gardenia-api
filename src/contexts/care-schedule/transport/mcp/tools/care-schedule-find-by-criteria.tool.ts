import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { CareScheduleFindByCriteriaQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-criteria/care-schedule-find-by-criteria.query';
import { careScheduleFindByCriteriaSchema } from '../schemas/care-schedule-find-by-criteria.schema';

@McpTool()
@Injectable()
export class CareScheduleFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareScheduleFindByCriteriaMcpTool.name);

  readonly name = 'care_schedule_find_by_criteria';
  readonly title = 'List care schedules';
  readonly description =
    'Returns a paginated list of care schedules in the current space.';
  readonly inputSchema = careScheduleFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding care schedules: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new CareScheduleFindByCriteriaQuery(criteria),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
