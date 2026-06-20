import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';
import { z } from 'zod';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';

const inputSchema = {
  page: z.number().int().positive().optional().describe('1-based page number'),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Number of items per page (max 100)'),
};

@McpTool()
@Injectable()
export class PlantFindByCriteriaTool implements IMcpTool {
  private readonly logger = new Logger(PlantFindByCriteriaTool.name);

  readonly name = 'plant_find_by_criteria';
  readonly title = 'List plants';
  readonly description =
    'Returns a paginated list of plants in the current space.';
  readonly inputSchema = inputSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding plants by criteria: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new PlantFindByCriteriaQuery({ criteria }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
}
