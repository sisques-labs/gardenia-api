import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';

const inputSchema = {
  name: z.string().min(1).describe('Display name of the plant'),
  plantSpeciesId: z
    .string()
    .uuid()
    .optional()
    .describe('Optional id of the linked plant species'),
  imageUrl: z
    .string()
    .url()
    .optional()
    .describe('Optional image URL for the plant'),
};

@McpTool()
@Injectable()
export class PlantCreateTool implements IMcpTool {
  private readonly logger = new Logger(PlantCreateTool.name);

  readonly name = 'plant_create';
  readonly title = 'Create plant';
  readonly description =
    'Creates a new plant in the current space owned by the authenticated user.';
  readonly inputSchema = inputSchema;

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
