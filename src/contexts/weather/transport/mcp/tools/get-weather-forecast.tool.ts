import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { GetWeatherForecastQuery } from '@contexts/weather/application/queries/get-weather-forecast/get-weather-forecast.query';
import { getWeatherForecastSchema } from '../schemas/get-weather-forecast.schema';

@McpTool()
@Injectable()
export class GetWeatherForecastMcpTool implements IMcpTool {
  private readonly logger = new Logger(GetWeatherForecastMcpTool.name);

  readonly name = 'weather_get_forecast';
  readonly title = 'Get weather forecast';
  readonly description =
    'Returns the weather forecast for a latitude/longitude.';
  readonly inputSchema = getWeatherForecastSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { latitude, longitude } = args as {
      latitude: number;
      longitude: number;
    };
    this.logger.log(`Getting forecast for ${latitude},${longitude}`);

    const result = await this.queryBus.execute(
      new GetWeatherForecastQuery({ latitude, longitude }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
