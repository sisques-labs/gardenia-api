import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { CompleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.command';
import { careScheduleCompleteSchema } from '../schemas/care-schedule-complete.schema';

@McpTool()
@Injectable()
export class CareScheduleCompleteMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareScheduleCompleteMcpTool.name);

  readonly name = 'care_schedule_complete';
  readonly title = 'Complete care schedule';
  readonly description =
    'Marks a care schedule complete, advancing its next due date by the interval.';
  readonly inputSchema = careScheduleCompleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id, completedAt } = args as {
      id: string;
      completedAt?: string | null;
    };
    this.logger.log(`Completing care schedule: ${id}`);

    await this.commandBus.execute(
      new CompleteCareScheduleCommand({
        id,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
