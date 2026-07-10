import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { DeletePlantSpeciesCommand } from '@contexts/plant-species/application/commands/delete-plant-species/delete-plant-species.command';
import { plantSpeciesDeleteSchema } from '../schemas/plant-species-delete.schema';

@McpTool()
@Injectable()
export class PlantSpeciesDeleteMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantSpeciesDeleteMcpTool.name);

  readonly name = 'plant_species_delete';
  readonly title = 'Delete plant species';
  readonly description = 'Deletes a plant species from the catalog.';
  readonly inputSchema = plantSpeciesDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting plant species: ${id}`);

    await this.commandBus.execute(new DeletePlantSpeciesCommand({ id }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
