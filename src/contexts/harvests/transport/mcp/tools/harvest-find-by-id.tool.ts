import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { HarvestFindByIdQuery } from '@contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.query';
import { harvestFindByIdSchema } from '../schemas/harvest-find-by-id.schema';

@McpTool()
@Injectable()
export class HarvestFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(HarvestFindByIdMcpTool.name);

  readonly name = 'harvest_find_by_id';
  readonly title = 'Find harvest by id';
  readonly description =
    'Returns a single harvest by its id, or null if it does not exist.';
  readonly inputSchema = harvestFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding harvest by id: ${id}`);

    const result = await this.queryBus.execute(
      new HarvestFindByIdQuery({ id }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
