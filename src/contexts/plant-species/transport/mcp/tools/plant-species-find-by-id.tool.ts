import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { plantSpeciesFindByIdSchema } from '../schemas/plant-species-find-by-id.schema';

@McpTool()
@Injectable()
export class PlantSpeciesFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantSpeciesFindByIdMcpTool.name);

  readonly name = 'plant_species_find_by_id';
  readonly title = 'Find plant species by id';
  readonly description =
    'Returns a single plant species by its id, or null if it does not exist.';
  readonly inputSchema = plantSpeciesFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { plantSpeciesId } = args as { plantSpeciesId: string };
    this.logger.log(`Finding plant species by id: ${plantSpeciesId}`);

    const result = await this.queryBus.execute(
      new PlantSpeciesFindByIdQuery({ plantSpeciesId }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
