import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria, Filter, FilterOperator } from '@sisques-labs/nestjs-kit';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { PlantIdentificationFindByCriteriaQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-criteria/plant-identification-find-by-criteria.query';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { plantIdentificationFindByCriteriaSchema } from '../schemas/plant-identification-find-by-criteria.schema';

@McpTool()
@Injectable()
export class PlantIdentificationFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(
    PlantIdentificationFindByCriteriaMcpTool.name,
  );

  readonly name = 'plant_identification_find_by_criteria';
  readonly title = 'List plant identifications';
  readonly description =
    'Returns a paginated list of plant identification attempts in the current space, optionally filtered by status.';
  readonly inputSchema = plantIdentificationFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { status, page, perPage } = args as {
      status?: PlantIdentificationStatusEnum;
      page?: number;
      perPage?: number;
    };
    this.logger.log(`Finding plant identifications: status=${status ?? '-'}`);

    const filters: Filter[] = [];
    if (status) {
      filters.push({
        field: 'status',
        operator: FilterOperator.EQUALS,
        value: status,
      });
    }

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(filters, undefined, pagination);

    const result = await this.queryBus.execute(
      new PlantIdentificationFindByCriteriaQuery(criteria),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
