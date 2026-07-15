import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { careLogCreateSchema } from '../schemas/care-log-create.schema';

@McpTool()
@Injectable()
export class CareLogCreateMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(CareLogCreateMcpTool.name);

  readonly name = 'care_log_create';
  readonly title = 'Create care log entry';
  readonly description =
    'Records a care activity (watering, fertilizing, etc.) for a plant in the current space.';
  readonly inputSchema = careLogCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { plantId, activityType, performedAt, notes, quantity, unit } =
      args as {
        plantId: string;
        activityType: CareLogActivityTypeEnum;
        performedAt?: string;
        notes?: string | null;
        quantity?: number | null;
        unit?: CareLogUnitEnum | null;
      };
    this.logger.log(`Creating care log entry for plant: ${plantId}`);

    const id = await this.commandBus.execute<CreateCareLogEntryCommand, string>(
      new CreateCareLogEntryCommand({
        plantId,
        userId: context.userId,
        spaceId: context.spaceId,
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
