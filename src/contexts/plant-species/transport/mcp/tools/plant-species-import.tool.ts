import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { ImportPlantSpeciesCommand } from '@contexts/plant-species/application/commands/import-plant-species/import-plant-species.command';
import { plantSpeciesImportSchema } from '../schemas/plant-species-import.schema';

@McpTool()
@Injectable()
export class PlantSpeciesImportMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantSpeciesImportMcpTool.name);

  readonly name = 'plant_species_import';
  readonly title = 'Import plant species';
  readonly description =
    'Imports a batch of plant species from the external catalog.';
  readonly inputSchema = plantSpeciesImportSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { limit, offset } = args as { limit: number; offset: number };
    this.logger.log(`Importing plant species: limit=${limit} offset=${offset}`);

    const result = await this.commandBus.execute(
      new ImportPlantSpeciesCommand({ limit, offset }),
    );

    return {
      content: [
        { type: 'text', text: JSON.stringify(result ?? { success: true }) },
      ],
    };
  }
}
