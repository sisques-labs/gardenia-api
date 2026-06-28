import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { DeleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.command';
import { careScheduleDeleteSchema } from '../schemas/care-schedule-delete.schema';

@McpTool()
@Injectable()
export class CareScheduleDeleteMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareScheduleDeleteMcpTool.name);

  readonly name = 'care_schedule_delete';
  readonly title = 'Delete care schedule';
  readonly description = 'Deletes a care schedule from the current space.';
  readonly inputSchema = careScheduleDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting care schedule: ${id}`);

    await this.commandBus.execute(new DeleteCareScheduleCommand({ id }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
