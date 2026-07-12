import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { NodeFindByIdQuery } from '@contexts/nodes/application/queries/node-find-by-id/node-find-by-id.query';
import { nodeFindByIdSchema } from '../schemas/node-find-by-id.schema';

@McpTool()
@Injectable()
export class NodeFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(NodeFindByIdMcpTool.name);

  readonly name = 'node_find_by_id';
  readonly title = 'Find a node by id';
  readonly description = 'Returns a node in the current space by id.';
  readonly inputSchema = nodeFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { nodeId } = args as { nodeId: string };
    this.logger.log(`Finding node by id: ${nodeId}`);

    const result = await this.queryBus.execute(
      new NodeFindByIdQuery({ nodeId }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
}
