import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { GetSpaceWeatherQuery } from '@contexts/spaces/application/queries/get-space-weather/get-space-weather.query';
import { spaceGetWeatherSchema } from '../schemas/space-get-weather.schema';

@McpTool()
@Injectable()
export class SpaceGetWeatherMcpTool implements IMcpTool {
  private readonly logger = new Logger(SpaceGetWeatherMcpTool.name);

  readonly name = 'space_get_weather';
  readonly title = 'Get space weather';
  readonly description = 'Returns the weather forecast for a space.';
  readonly inputSchema = spaceGetWeatherSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { spaceId } = args as { spaceId: string };
    this.logger.log(`Getting weather for space: ${spaceId}`);

    const result = await this.queryBus.execute(
      new GetSpaceWeatherQuery({ spaceId }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
