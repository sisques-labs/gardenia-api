import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { NodeFindByCriteriaQuery } from '@contexts/nodes/application/queries/node-find-by-criteria/node-find-by-criteria.query';
import { nodeFindByCriteriaSchema } from '../schemas/node-find-by-criteria.schema';

@McpTool()
@Injectable()
export class NodeFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(NodeFindByCriteriaMcpTool.name);

  readonly name = 'node_find_by_criteria';
  readonly title = 'List nodes';
  readonly description =
    'Returns a paginated list of nodes in the current space.';
  readonly inputSchema = nodeFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding nodes by criteria: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new NodeFindByCriteriaQuery({ criteria }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
}
