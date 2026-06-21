import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { UserFindByCriteriaQuery } from '@contexts/users/application/queries/user-find-by-criteria/user-find-by-criteria.query';
import { userFindByCriteriaSchema } from '../schemas/user-find-by-criteria.schema';

@McpTool()
@Injectable()
export class UserFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(UserFindByCriteriaMcpTool.name);

  readonly name = 'user_find_by_criteria';
  readonly title = 'List users';
  readonly description = 'Returns a paginated list of users.';
  readonly inputSchema = userFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding users: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new UserFindByCriteriaQuery({ criteria }),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
