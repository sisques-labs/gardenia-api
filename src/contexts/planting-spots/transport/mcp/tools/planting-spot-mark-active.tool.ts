import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { MarkPlantingSpotActiveCommand } from '@contexts/planting-spots/application/commands/mark-planting-spot-active/mark-planting-spot-active.command';
import { plantingSpotMarkActiveSchema } from '../schemas/planting-spot-mark-active.schema';

@McpTool()
@Injectable()
export class PlantingSpotMarkActiveMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(PlantingSpotMarkActiveMcpTool.name);

  readonly name = 'planting_spot_mark_active';
  readonly title = 'Mark planting spot active';
  readonly description =
    'Marks a planting spot as active (reactivates it) in the current space.';
  readonly inputSchema = plantingSpotMarkActiveSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Marking planting spot active: ${id}`);

    await this.commandBus.execute(
      new MarkPlantingSpotActiveCommand({
        id,
        spaceId: context.spaceId,
        requestingUserId: context.userId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
