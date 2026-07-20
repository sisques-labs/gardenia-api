import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { PlantIdentificationFindByIdQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-id/plant-identification-find-by-id.query';
import { plantIdentificationFindByIdSchema } from '../schemas/plant-identification-find-by-id.schema';

@McpTool()
@Injectable()
export class PlantIdentificationFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantIdentificationFindByIdMcpTool.name);

  readonly name = 'plant_identification_find_by_id';
  readonly title = 'Find plant identification by id';
  readonly description =
    'Returns a single plant identification attempt by its id, or null if it does not exist.';
  readonly inputSchema = plantIdentificationFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding plant identification by id: ${id}`);

    const result = await this.queryBus.execute(
      new PlantIdentificationFindByIdQuery({ id }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
