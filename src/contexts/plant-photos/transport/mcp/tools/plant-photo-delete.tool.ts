import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { DeletePlantPhotoCommand } from '@contexts/plant-photos/application/commands/delete-plant-photo/delete-plant-photo.command';
import { plantPhotoDeleteSchema } from '../schemas/plant-photo-delete.schema';

@McpTool()
@Injectable()
export class PlantPhotoDeleteMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantPhotoDeleteMcpTool.name);

  readonly name = 'plant_photo_delete';
  readonly title = 'Delete plant photo';
  readonly description = 'Deletes a plant photo (uploader only).';
  readonly inputSchema = plantPhotoDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting plant photo: ${id}`);

    await this.commandBus.execute(
      new DeletePlantPhotoCommand({ id, requestingUserId: context.userId }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
