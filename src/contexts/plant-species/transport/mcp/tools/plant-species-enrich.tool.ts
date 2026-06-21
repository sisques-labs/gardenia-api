import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { EnrichPlantSpeciesCommand } from '@contexts/plant-species/application/commands/enrich-plant-species/enrich-plant-species.command';
import { plantSpeciesEnrichSchema } from '../schemas/plant-species-enrich.schema';

@McpTool()
@Injectable()
export class PlantSpeciesEnrichMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantSpeciesEnrichMcpTool.name);

  readonly name = 'plant_species_enrich';
  readonly title = 'Enrich plant species';
  readonly description =
    'Enriches a plant species with external data by scientific name.';
  readonly inputSchema = plantSpeciesEnrichSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { scientificName } = args as { scientificName: string };
    this.logger.log(`Enriching plant species: ${scientificName}`);

    await this.commandBus.execute(
      new EnrichPlantSpeciesCommand({ scientificName }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    };
  }
}
