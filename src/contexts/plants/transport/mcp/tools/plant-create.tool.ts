import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';
import { plantCreateSchema } from '../schemas/plant-create.schema';

@McpTool()
@Injectable()
export class PlantCreateMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantCreateMcpTool.name);

  readonly name = 'plant_create';
  readonly title = 'Create plant';
  readonly description =
    'Creates a new plant in the current space owned by the authenticated user.';
  readonly inputSchema = plantCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { name, plantSpeciesId, imageUrl } = args as {
      name: string;
      plantSpeciesId?: string;
      imageUrl?: string;
    };
    this.logger.log(`Creating plant for user: ${context.userId}`);

    const plantId = await this.commandBus.execute<CreatePlantCommand, string>(
      new CreatePlantCommand({
        name,
        plantSpeciesId: plantSpeciesId ?? undefined,
        imageUrl: imageUrl ?? undefined,
        userId: context.userId,
      }),
    );

    return {
      content: [
        { type: 'text', text: JSON.stringify({ success: true, id: plantId }) },
      ],
    };
  }
}
