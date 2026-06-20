import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { DeletePlantCommand } from '@contexts/plants/application/commands/delete-plant/delete-plant.command';
import { plantDeleteSchema } from '../schemas/plant-delete.schema';

@McpTool()
@Injectable()
export class PlantDeleteTool implements IMcpTool {
  private readonly logger = new Logger(PlantDeleteTool.name);

  readonly name = 'plant_delete';
  readonly title = 'Delete plant';
  readonly description = 'Deletes a plant from the current space.';
  readonly inputSchema = plantDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting plant ${id} for user: ${context.userId}`);

    await this.commandBus.execute(
      new DeletePlantCommand({
        plantId: id,
        requestingUserId: context.userId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
