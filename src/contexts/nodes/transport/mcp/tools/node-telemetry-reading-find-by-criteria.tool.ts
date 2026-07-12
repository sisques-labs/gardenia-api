import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { NodeTelemetryReadingFindByCriteriaQuery } from '@contexts/nodes/application/queries/node-telemetry-reading-find-by-criteria/node-telemetry-reading-find-by-criteria.query';
import { nodeTelemetryReadingFindByCriteriaSchema } from '../schemas/node-telemetry-reading-find-by-criteria.schema';

@McpTool()
@Injectable()
export class NodeTelemetryReadingFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(
    NodeTelemetryReadingFindByCriteriaMcpTool.name,
  );

  readonly name = 'node_telemetry_reading_find_by_criteria';
  readonly title = 'List node telemetry readings';
  readonly description =
    'Returns a paginated list of telemetry readings in the current space.';
  readonly inputSchema = nodeTelemetryReadingFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding node telemetry readings by criteria: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new NodeTelemetryReadingFindByCriteriaQuery({ criteria }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
}
