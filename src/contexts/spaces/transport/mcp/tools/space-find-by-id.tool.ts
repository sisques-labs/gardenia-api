import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { SpaceFindByIdQuery } from '@contexts/spaces/application/queries/space-find-by-id/space-find-by-id.query';
import { spaceFindByIdSchema } from '../schemas/space-find-by-id.schema';

@McpTool()
@Injectable()
export class SpaceFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(SpaceFindByIdMcpTool.name);

  readonly name = 'space_find_by_id';
  readonly title = 'Find space by id';
  readonly description =
    'Returns a single space by its id, or null if it does not exist.';
  readonly inputSchema = spaceFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { spaceId } = args as { spaceId: string };
    this.logger.log(`Finding space by id: ${spaceId}`);

    const result = await this.queryBus.execute(
      new SpaceFindByIdQuery({ spaceId }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
