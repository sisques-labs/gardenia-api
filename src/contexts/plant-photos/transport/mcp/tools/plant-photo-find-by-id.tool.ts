import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { PlantPhotoFindByIdQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-id/plant-photo-find-by-id.query';
import { plantPhotoFindByIdSchema } from '../schemas/plant-photo-find-by-id.schema';

@McpTool()
@Injectable()
export class PlantPhotoFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(PlantPhotoFindByIdMcpTool.name);

  readonly name = 'plant_photo_find_by_id';
  readonly title = 'Find plant photo by id';
  readonly description =
    'Returns a single plant photo by its id, or null if it does not exist.';
  readonly inputSchema = plantPhotoFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding plant photo by id: ${id}`);

    const result = await this.queryBus.execute(
      new PlantPhotoFindByIdQuery({ id }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
