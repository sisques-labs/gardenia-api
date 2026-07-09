import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IGardeniaMcpToolContext } from '@core/mcp/gardenia-mcp-context.interface';
import { WaterPlantingSpotCommand } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.command';
import { WaterPlantingSpotResult } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.result';
import { plantingSpotWaterSchema } from '../schemas/planting-spot-water.schema';

@McpTool()
@Injectable()
export class PlantingSpotWaterMcpTool implements IMcpTool<IGardeniaMcpToolContext> {
  private readonly logger = new Logger(PlantingSpotWaterMcpTool.name);

  readonly name = 'planting_spot_water';
  readonly title = 'Water planting spot';
  readonly description =
    'Waters every plant in a planting spot in one action (hybrid mechanism, best-effort).';
  readonly inputSchema = plantingSpotWaterSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IGardeniaMcpToolContext,
  ): Promise<CallToolResult> {
    const { id, performedAt } = args as {
      id: string;
      performedAt?: string | null;
    };
    this.logger.log(`Watering planting spot: ${id}`);

    const result = await this.commandBus.execute<
      WaterPlantingSpotCommand,
      WaterPlantingSpotResult
    >(
      new WaterPlantingSpotCommand({
        id,
        userId: context.userId,
        spaceId: context.spaceId,
        performedAt: performedAt ? new Date(performedAt) : undefined,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
}
