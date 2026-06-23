import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { SpacesFindByUserQuery } from '@contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.query';

@McpTool()
@Injectable()
export class SpacesFindByUserMcpTool implements IMcpTool {
  private readonly logger = new Logger(SpacesFindByUserMcpTool.name);

  readonly name = 'spaces_find_by_user';
  readonly title = 'List my spaces';
  readonly description =
    'Returns the spaces the authenticated user belongs to.';
  readonly inputSchema = {};

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    _args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    this.logger.log(`Finding spaces for user: ${context.userId}`);

    const result = await this.queryBus.execute(
      new SpacesFindByUserQuery({ userId: context.userId }),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
