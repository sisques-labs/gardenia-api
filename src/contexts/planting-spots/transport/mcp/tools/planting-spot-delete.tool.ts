import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IGardeniaMcpToolContext } from '@core/mcp/gardenia-mcp-context.interface';
import { DeletePlantingSpotCommand } from '@contexts/planting-spots/application/commands/delete-planting-spot/delete-planting-spot.command';
import { plantingSpotDeleteSchema } from '../schemas/planting-spot-delete.schema';

@McpTool()
@Injectable()
export class PlantingSpotDeleteMcpTool implements IMcpTool<IGardeniaMcpToolContext> {
  private readonly logger = new Logger(PlantingSpotDeleteMcpTool.name);

  readonly name = 'planting_spot_delete';
  readonly title = 'Delete planting spot';
  readonly description = 'Deletes a planting spot from the current space.';
  readonly inputSchema = plantingSpotDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IGardeniaMcpToolContext,
  ): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting planting spot: ${id}`);

    await this.commandBus.execute(
      new DeletePlantingSpotCommand({
        id,
        spaceId: context.spaceId,
        requestingUserId: context.userId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
