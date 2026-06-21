import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { plantSpeciesCreateSchema } from '../schemas/plant-species-create.schema';

@McpTool()
@Injectable()
export class PlantSpeciesCreateMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantSpeciesCreateMcpTool.name);

  readonly name = 'plant_species_create';
  readonly title = 'Create plant species';
  readonly description = 'Creates a plant species in the shared catalog.';
  readonly inputSchema = plantSpeciesCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { scientificName } = args as { scientificName: string };
    this.logger.log(`Creating plant species: ${scientificName}`);

    const id = await this.commandBus.execute<CreatePlantSpeciesCommand, string>(
      new CreatePlantSpeciesCommand({ scientificName }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
