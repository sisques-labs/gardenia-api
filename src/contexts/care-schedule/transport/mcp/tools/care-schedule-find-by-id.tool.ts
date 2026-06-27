import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { CareScheduleFindByIdQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-id/care-schedule-find-by-id.query';
import { careScheduleFindByIdSchema } from '../schemas/care-schedule-find-by-id.schema';

@McpTool()
@Injectable()
export class CareScheduleFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareScheduleFindByIdMcpTool.name);

  readonly name = 'care_schedule_find_by_id';
  readonly title = 'Find care schedule by id';
  readonly description =
    'Returns a single care schedule by its id, or null if it does not exist.';
  readonly inputSchema = careScheduleFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding care schedule by id: ${id}`);

    const result = await this.queryBus.execute(
      new CareScheduleFindByIdQuery({ id }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
