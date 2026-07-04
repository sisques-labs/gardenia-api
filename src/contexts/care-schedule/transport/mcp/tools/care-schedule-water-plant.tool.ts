import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { WaterPlantCommand } from '@contexts/care-schedule/application/commands/water-plant/water-plant.command';
import { WaterPlantResult } from '@contexts/care-schedule/application/commands/water-plant/water-plant.result';
import { careScheduleWaterPlantSchema } from '../schemas/care-schedule-water-plant.schema';

@McpTool()
@Injectable()
export class CareScheduleWaterPlantMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareScheduleWaterPlantMcpTool.name);

  readonly name = 'care_schedule_water_plant';
  readonly title = 'Water plant';
  readonly description =
    'Waters a single plant: completes its active WATERING care schedule if one exists, otherwise records an ad-hoc care-log entry.';
  readonly inputSchema = careScheduleWaterPlantSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { plantId, performedAt } = args as {
      plantId: string;
      performedAt?: string | null;
    };
    this.logger.log(`Watering plant: ${plantId}`);

    const result = await this.commandBus.execute<
      WaterPlantCommand,
      WaterPlantResult
    >(
      new WaterPlantCommand({
        plantId,
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
