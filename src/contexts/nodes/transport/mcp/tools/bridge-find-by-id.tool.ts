import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { BridgeFindByIdQuery } from '@contexts/nodes/application/queries/bridge-find-by-id/bridge-find-by-id.query';
import { bridgeFindByIdSchema } from '../schemas/bridge-find-by-id.schema';

@McpTool()
@Injectable()
export class BridgeFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(BridgeFindByIdMcpTool.name);

  readonly name = 'bridge_find_by_id';
  readonly title = 'Find a bridge by id';
  readonly description = 'Returns a bridge in the current space by id.';
  readonly inputSchema = bridgeFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { bridgeId } = args as { bridgeId: string };
    this.logger.log(`Finding bridge by id: ${bridgeId}`);

    const result = await this.queryBus.execute(
      new BridgeFindByIdQuery({ bridgeId }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
}
