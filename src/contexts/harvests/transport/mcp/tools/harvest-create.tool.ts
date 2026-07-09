import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IGardeniaMcpToolContext } from '@core/mcp/gardenia-mcp-context.interface';
import { CreateHarvestCommand } from '@contexts/harvests/application/commands/create-harvest/create-harvest.command';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { harvestCreateSchema } from '../schemas/harvest-create.schema';

@McpTool()
@Injectable()
export class HarvestCreateMcpTool implements IMcpTool<IGardeniaMcpToolContext> {
  private readonly logger = new Logger(HarvestCreateMcpTool.name);

  readonly name = 'harvest_create';
  readonly title = 'Create harvest';
  readonly description = 'Records a harvest in the current space.';
  readonly inputSchema = harvestCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IGardeniaMcpToolContext,
  ): Promise<CallToolResult> {
    const { cropType, quantity, unit, harvestedAt } = args as {
      cropType: string;
      quantity: number;
      unit: HarvestUnitEnum;
      harvestedAt?: string;
    };
    this.logger.log(`Creating harvest for user: ${context.userId}`);

    const id = await this.commandBus.execute<CreateHarvestCommand, string>(
      new CreateHarvestCommand({
        cropType,
        quantity,
        unit,
        harvestedAt: harvestedAt ? new Date(harvestedAt) : undefined,
        userId: context.userId,
        spaceId: context.spaceId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
