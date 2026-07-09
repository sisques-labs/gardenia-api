import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IGardeniaMcpToolContext } from '@core/mcp/gardenia-mcp-context.interface';
import { MarkPlantingSpotFallowCommand } from '@contexts/planting-spots/application/commands/mark-planting-spot-fallow/mark-planting-spot-fallow.command';
import { plantingSpotMarkFallowSchema } from '../schemas/planting-spot-mark-fallow.schema';

@McpTool()
@Injectable()
export class PlantingSpotMarkFallowMcpTool implements IMcpTool<IGardeniaMcpToolContext> {
  private readonly logger = new Logger(PlantingSpotMarkFallowMcpTool.name);

  readonly name = 'planting_spot_mark_fallow';
  readonly title = 'Mark planting spot fallow';
  readonly description =
    'Marks a planting spot as fallow (resting) in the current space.';
  readonly inputSchema = plantingSpotMarkFallowSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IGardeniaMcpToolContext,
  ): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Marking planting spot fallow: ${id}`);

    await this.commandBus.execute(
      new MarkPlantingSpotFallowCommand({
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
