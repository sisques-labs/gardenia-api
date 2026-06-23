import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { UpdateCareLogEntryCommand } from '@contexts/care-log/application/commands/update-care-log-entry/update-care-log-entry.command';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { careLogUpdateSchema } from '../schemas/care-log-update.schema';

@McpTool()
@Injectable()
export class CareLogUpdateMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareLogUpdateMcpTool.name);

  readonly name = 'care_log_update';
  readonly title = 'Update care log entry';
  readonly description =
    'Updates an existing care log entry. Only provided fields are changed.';
  readonly inputSchema = careLogUpdateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { id, activityType, performedAt, notes, quantity, unit } = args as {
      id: string;
      activityType?: CareLogActivityTypeEnum;
      performedAt?: string;
      notes?: string | null;
      quantity?: number | null;
      unit?: CareLogUnitEnum | null;
    };
    this.logger.log(`Updating care log entry: ${id}`);

    await this.commandBus.execute(
      new UpdateCareLogEntryCommand({
        id,
        requestingUserId: context.userId,
        activityType,
        performedAt: performedAt ? new Date(performedAt) : undefined,
        notes,
        quantity,
        unit,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
