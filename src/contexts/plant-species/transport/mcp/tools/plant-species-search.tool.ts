import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { GbifSpeciesSearchQuery } from '@contexts/plant-species/application/queries/gbif-species-search/gbif-species-search.query';
import { gbifSpeciesSearchSchema } from '../schemas/gbif-species-search.schema';

@McpTool()
@Injectable()
export class PlantSpeciesSearchMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantSpeciesSearchMcpTool.name);

  readonly name = 'plant_species_search';
  readonly title = 'Search GBIF species';
  readonly description =
    'Live-searches GBIF for matching species by name (autocomplete). Nothing is persisted.';
  readonly inputSchema = gbifSpeciesSearchSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { name, limit } = args as { name: string; limit?: number };
    this.logger.log(`Searching GBIF species: name=${name}`);

    const result = await this.queryBus.execute(
      new GbifSpeciesSearchQuery({ name, limit }),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
