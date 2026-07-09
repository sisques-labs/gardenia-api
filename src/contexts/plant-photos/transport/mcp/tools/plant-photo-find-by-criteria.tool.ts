import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria, Filter, FilterOperator } from '@sisques-labs/nestjs-kit';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { PlantPhotoFindByCriteriaQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-criteria/plant-photo-find-by-criteria.query';
import { plantPhotoFindByCriteriaSchema } from '../schemas/plant-photo-find-by-criteria.schema';

@McpTool()
@Injectable()
export class PlantPhotoFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantPhotoFindByCriteriaMcpTool.name);

  readonly name = 'plant_photo_find_by_criteria';
  readonly title = 'List plant photos';
  readonly description =
    'Returns a paginated list of photos in the current space, optionally filtered by plant.';
  readonly inputSchema = plantPhotoFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { plantId, page, perPage } = args as {
      plantId?: string;
      page?: number;
      perPage?: number;
    };
    this.logger.log(`Finding plant photos: plantId=${plantId ?? '-'}`);

    const filters: Filter[] = [];
    if (plantId) {
      filters.push({
        field: 'plantId',
        operator: FilterOperator.EQUALS,
        value: plantId,
      });
    }

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(filters, undefined, pagination);

    const result = await this.queryBus.execute(
      new PlantPhotoFindByCriteriaQuery(criteria),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
