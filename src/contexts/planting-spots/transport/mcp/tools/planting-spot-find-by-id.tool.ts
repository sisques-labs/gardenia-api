import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { plantingSpotFindByIdSchema } from '../schemas/planting-spot-find-by-id.schema';

@McpTool()
@Injectable()
export class PlantingSpotFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantingSpotFindByIdMcpTool.name);

  readonly name = 'planting_spot_find_by_id';
  readonly title = 'Find planting spot by id';
  readonly description =
    'Returns a single planting spot by its id, or null if it does not exist.';
  readonly inputSchema = plantingSpotFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding planting spot by id: ${id}`);

    const result = await this.queryBus.execute(
      new PlantingSpotFindByIdQuery({ id }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
