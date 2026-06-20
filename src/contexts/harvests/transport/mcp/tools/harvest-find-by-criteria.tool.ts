import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { HarvestFindByCriteriaQuery } from '@contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.query';
import { harvestFindByCriteriaSchema } from '../schemas/harvest-find-by-criteria.schema';

@McpTool()
@Injectable()
export class HarvestFindByCriteriaTool implements IMcpTool {
  private readonly logger = new Logger(HarvestFindByCriteriaTool.name);

  readonly name = 'harvest_find_by_criteria';
  readonly title = 'List harvests';
  readonly description =
    'Returns a paginated list of harvests in the current space.';
  readonly inputSchema = harvestFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding harvests: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new HarvestFindByCriteriaQuery(criteria),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
