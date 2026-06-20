import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';

const inputSchema = {
  id: z.string().uuid().describe('The id of the plant to update'),
  name: z.string().min(1).optional().describe('New display name'),
  plantSpeciesId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe('New linked species id, or null to unlink'),
  imageUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe('New image URL, or null to remove'),
};

@McpTool()
@Injectable()
export class PlantUpdateTool implements IMcpTool {
  private readonly logger = new Logger(PlantUpdateTool.name);

  readonly name = 'plant_update';
  readonly title = 'Update plant';
  readonly description =
    'Updates an existing plant in the current space. Only provided fields are changed.';
  readonly inputSchema = inputSchema;

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
