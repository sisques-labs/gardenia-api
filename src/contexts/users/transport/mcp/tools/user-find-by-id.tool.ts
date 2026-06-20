import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { UserFindByIdQuery } from '@contexts/users/application/queries/user-find-by-id/user-find-by-id.query';
import { userFindByIdSchema } from '../schemas/user-find-by-id.schema';

@McpTool()
@Injectable()
export class UserFindByIdTool implements IMcpTool {
  private readonly logger = new Logger(UserFindByIdTool.name);

  readonly name = 'user_find_by_id';
  readonly title = 'Find user by id';
  readonly description =
    'Returns a single user by their id, or null if it does not exist.';
  readonly inputSchema = userFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding user by id: ${id}`);

    const result = await this.queryBus.execute(new UserFindByIdQuery({ id }));

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
