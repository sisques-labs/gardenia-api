import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';
import { plantUpdateSchema } from '../schemas/plant-update.schema';

@McpTool()
@Injectable()
export class PlantUpdateMcpTool implements IMcpTool {
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
    const { id, name, plantSpeciesId, imageUrl } = args as {
      id: string;
      name?: string;
      plantSpeciesId?: string | null;
      imageUrl?: string | null;
    };
    this.logger.log(`Updating plant ${id} for user: ${context.userId}`);

    await this.commandBus.execute(
      new UpdatePlantCommand({
        plantId: id,
        name,
        plantSpeciesId,
        imageUrl,
        requestingUserId: context.userId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
