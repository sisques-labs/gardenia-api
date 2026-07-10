import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';
import { plantUpdateSchema } from '../schemas/plant-update.schema';

@McpTool()
@Injectable()
export class PlantUpdateMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(PlantUpdateMcpTool.name);

  readonly name = 'plant_update';
  readonly title = 'Update plant';
  readonly description =
    'Updates an existing plant in the current space. Only provided fields are changed.';
  readonly inputSchema = plantUpdateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const {
      id,
      name,
      gbifSpeciesKey,
      speciesScientificName,
      imageUrl,
      plantingSpotId,
    } = args as {
      id: string;
      name?: string;
      gbifSpeciesKey?: number | null;
      speciesScientificName?: string | null;
      imageUrl?: string | null;
      plantingSpotId?: string | null;
    };
    this.logger.log(`Updating plant ${id} for user: ${context.userId}`);

    await this.commandBus.execute(
      new UpdatePlantCommand({
        plantId: id,
        name,
        gbifSpeciesKey,
        speciesScientificName,
        imageUrl,
        plantingSpotId,
        requestingUserId: context.userId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
