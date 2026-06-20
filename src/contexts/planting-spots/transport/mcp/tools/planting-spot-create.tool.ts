import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { CreatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { plantingSpotCreateSchema } from '../schemas/planting-spot-create.schema';

@McpTool()
@Injectable()
export class PlantingSpotCreateTool implements IMcpTool {
  private readonly logger = new Logger(PlantingSpotCreateTool.name);

  readonly name = 'planting_spot_create';
  readonly title = 'Create planting spot';
  readonly description = 'Creates a planting spot in the current space.';
  readonly inputSchema = plantingSpotCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const {
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
      name: string;
      type: PlantingSpotTypeEnum;
      description?: string | null;
      capacity?: number | null;
      row?: number | null;
      column?: number | null;
      dimensionsWidth?: number | null;
      dimensionsHeight?: number | null;
      dimensionsLength?: number | null;
      soilType?: string | null;
    };
    this.logger.log(`Creating planting spot for user: ${context.userId}`);

    const id = await this.commandBus.execute<CreatePlantingSpotCommand, string>(
      new CreatePlantingSpotCommand({
        name,
        type,
        description: description ?? null,
        capacity: capacity ?? null,
        row: row ?? null,
        column: column ?? null,
        dimensionsWidth: dimensionsWidth ?? null,
        dimensionsHeight: dimensionsHeight ?? null,
        dimensionsLength: dimensionsLength ?? null,
        soilType: soilType ?? null,
        userId: context.userId,
        spaceId: context.spaceId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
