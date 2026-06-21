import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { WEATHER_PORT } from './application/ports/weather.port';
import { GetWeatherForecastQueryHandler } from './application/queries/get-weather-forecast/get-weather-forecast.handler';
import { OpenMeteoAdapter } from './infrastructure/adapters/open-meteo.adapter';
import { GetWeatherForecastMcpTool } from './transport/mcp/tools/get-weather-forecast.tool';

const QUERY_HANDLERS = [GetWeatherForecastQueryHandler];

const INFRASTRUCTURE_ADAPTERS = [
  { provide: WEATHER_PORT, useClass: OpenMeteoAdapter },
];

const MCP_TOOLS = [GetWeatherForecastMcpTool];

@Module({
  imports: [CqrsModule],
  providers: [...QUERY_HANDLERS, ...INFRASTRUCTURE_ADAPTERS, ...MCP_TOOLS],
  exports: [],
})
export class WeatherModule {}
