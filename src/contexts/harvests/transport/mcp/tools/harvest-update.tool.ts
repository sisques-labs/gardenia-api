import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { UpdateHarvestCommand } from '@contexts/harvests/application/commands/update-harvest/update-harvest.command';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { harvestUpdateSchema } from '../schemas/harvest-update.schema';

@McpTool()
@Injectable()
export class HarvestUpdateMcpTool implements IMcpTool {
  private readonly logger = new Logger(HarvestUpdateMcpTool.name);

  readonly name = 'harvest_update';
  readonly title = 'Update harvest';
  readonly description =
    'Updates an existing harvest. Only provided fields are changed.';
  readonly inputSchema = harvestUpdateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id, cropType, quantity, unit, harvestedAt } = args as {
      id: string;
      cropType?: string;
      quantity?: number;
      unit?: HarvestUnitEnum;
      harvestedAt?: string;
    };
    this.logger.log(`Updating harvest: ${id}`);

    await this.commandBus.execute(
      new UpdateHarvestCommand({
        id,
        cropType,
        quantity,
        unit,
        harvestedAt: harvestedAt ? new Date(harvestedAt) : undefined,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
