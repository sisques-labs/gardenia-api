import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { CareLogFindByCriteriaQuery } from '@contexts/care-log/application/queries/care-log-find-by-criteria/care-log-find-by-criteria.query';
import { careLogFindByCriteriaSchema } from '../schemas/care-log-find-by-criteria.schema';

@McpTool()
@Injectable()
export class CareLogFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareLogFindByCriteriaMcpTool.name);

  readonly name = 'care_log_find_by_criteria';
  readonly title = 'List care log entries';
  readonly description =
    'Returns a paginated list of care log entries in the current space.';
  readonly inputSchema = careLogFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding care log entries: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new CareLogFindByCriteriaQuery({ criteria }),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
