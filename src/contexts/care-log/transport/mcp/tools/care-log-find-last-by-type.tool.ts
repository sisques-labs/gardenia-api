import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { CareLogFindLastByTypeQuery } from '@contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.query';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { careLogFindLastByTypeSchema } from '../schemas/care-log-find-last-by-type.schema';

@McpTool()
@Injectable()
export class CareLogFindLastByTypeMcpTool implements IMcpTool {
  private readonly logger = new Logger(CareLogFindLastByTypeMcpTool.name);

  readonly name = 'care_log_find_last_by_type';
  readonly title = 'Find last care log entry by type';
  readonly description =
    'Returns the most recent care log entry of a given activity type for a plant, or null.';
  readonly inputSchema = careLogFindLastByTypeSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { plantId, activityType } = args as {
      plantId: string;
      activityType: CareLogActivityTypeEnum;
    };
    this.logger.log(
      `Finding last care log entry for plant ${plantId} type ${activityType}`,
    );

    const result = await this.queryBus.execute(
      new CareLogFindLastByTypeQuery({ plantId, activityType }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
