import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { plantFindByIdSchema } from '../schemas/plant-find-by-id.schema';

@McpTool()
@Injectable()
export class PlantFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantFindByIdMcpTool.name);

  readonly name = 'plant_find_by_id';
  readonly title = 'Find plant by id';
  readonly description =
    'Returns a single plant by its id within the current space, or null if it does not exist.';
  readonly inputSchema = plantFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding plant by id: ${id}`);

    const result = await this.queryBus.execute(
      new PlantFindByIdQuery({ plantId: id }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
