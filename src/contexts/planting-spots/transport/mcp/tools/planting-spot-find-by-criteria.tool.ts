import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { PlantingSpotFindByCriteriaQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query';
import { plantingSpotFindByCriteriaSchema } from '../schemas/planting-spot-find-by-criteria.schema';

@McpTool()
@Injectable()
export class PlantingSpotFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantingSpotFindByCriteriaMcpTool.name);

  readonly name = 'planting_spot_find_by_criteria';
  readonly title = 'List planting spots';
  readonly description =
    'Returns a paginated list of planting spots in the current space.';
  readonly inputSchema = plantingSpotFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding planting spots: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new PlantingSpotFindByCriteriaQuery({ criteria }),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
