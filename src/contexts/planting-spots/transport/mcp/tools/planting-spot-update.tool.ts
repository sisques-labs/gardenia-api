import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { UpdatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.command';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { plantingSpotUpdateSchema } from '../schemas/planting-spot-update.schema';

@McpTool()
@Injectable()
export class PlantingSpotUpdateMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(PlantingSpotUpdateMcpTool.name);

  readonly name = 'planting_spot_update';
  readonly title = 'Update planting spot';
  readonly description =
    'Updates a planting spot in the current space. Only provided fields are changed.';
  readonly inputSchema = plantingSpotUpdateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const {
      id,
      name,
      type,
      description,
      capacity,
      row,
      column,
      dimensionsWidth,
      dimensionsHeight,
      dimensionsLength,
      soilType,
    } = args as {
      id: string;
      name?: string;
      type?: PlantingSpotTypeEnum;
      description?: string | null;
      capacity?: number | null;
      row?: number | null;
      column?: number | null;
      dimensionsWidth?: number | null;
      dimensionsHeight?: number | null;
      dimensionsLength?: number | null;
      soilType?: string | null;
    };
    this.logger.log(`Updating planting spot: ${id}`);

    await this.commandBus.execute(
      new UpdatePlantingSpotCommand({
        id,
        spaceId: context.spaceId,
        requestingUserId: context.userId,
        name,
        type,
        description,
        capacity,
        row,
        column,
        dimensionsWidth,
        dimensionsHeight,
        dimensionsLength,
        soilType,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
