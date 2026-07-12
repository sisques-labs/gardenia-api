import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { BridgeFindByCriteriaQuery } from '@contexts/nodes/application/queries/bridge-find-by-criteria/bridge-find-by-criteria.query';
import { bridgeFindByCriteriaSchema } from '../schemas/bridge-find-by-criteria.schema';

@McpTool()
@Injectable()
export class BridgeFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(BridgeFindByCriteriaMcpTool.name);

  readonly name = 'bridge_find_by_criteria';
  readonly title = 'List bridges';
  readonly description =
    'Returns a paginated list of bridges claimed into the current space.';
  readonly inputSchema = bridgeFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding bridges by criteria: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new BridgeFindByCriteriaQuery({ criteria }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
}
