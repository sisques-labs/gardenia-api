import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { UpdateCareScheduleCommand } from '@contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.command';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { careScheduleUpdateSchema } from '../schemas/care-schedule-update.schema';

@McpTool()
@Injectable()
export class CareScheduleUpdateMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareScheduleUpdateMcpTool.name);

  readonly name = 'care_schedule_update';
  readonly title = 'Update care schedule';
  readonly description =
    'Updates a care schedule. Only provided fields are changed. Use the complete tool to advance the next due date.';
  readonly inputSchema = careScheduleUpdateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id, activityType, intervalDays, quantity, unit, notes, active } =
      args as {
        id: string;
        activityType?: CareScheduleActivityTypeEnum;
        intervalDays?: number;
        quantity?: number | null;
        unit?: CareScheduleUnitEnum | null;
        notes?: string | null;
        active?: boolean;
      };
    this.logger.log(`Updating care schedule: ${id}`);

    await this.commandBus.execute(
      new UpdateCareScheduleCommand({
        id,
        activityType,
        intervalDays,
        quantity,
        unit,
        notes,
        active,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
