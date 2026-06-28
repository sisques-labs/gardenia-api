import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { CreateCareScheduleCommand } from '@contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.command';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { careScheduleCreateSchema } from '../schemas/care-schedule-create.schema';

@McpTool()
@Injectable()
export class CareScheduleCreateMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareScheduleCreateMcpTool.name);

  readonly name = 'care_schedule_create';
  readonly title = 'Create care schedule';
  readonly description =
    'Creates a care schedule for a plant in the current space. Provide intervalDays for a recurring schedule, or omit it for a one-time schedule due on nextDueAt.';
  readonly inputSchema = careScheduleCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const {
      plantId,
      activityType,
      intervalDays,
      quantity,
      unit,
      notes,
      nextDueAt,
      active,
    } = args as {
      plantId: string;
      activityType: CareScheduleActivityTypeEnum;
      intervalDays?: number | null;
      quantity?: number | null;
      unit?: CareScheduleUnitEnum | null;
      notes?: string | null;
      nextDueAt?: string | null;
      active?: boolean | null;
    };
    this.logger.log(`Creating care schedule for user: ${context.userId}`);

    const id = await this.commandBus.execute<CreateCareScheduleCommand, string>(
      new CreateCareScheduleCommand({
        plantId,
        activityType,
        intervalDays,
        quantity,
        unit,
        notes,
        nextDueAt: nextDueAt ? new Date(nextDueAt) : undefined,
        active: active ?? undefined,
        userId: context.userId,
        spaceId: context.spaceId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
