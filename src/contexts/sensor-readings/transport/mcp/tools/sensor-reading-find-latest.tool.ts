import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { FindLatestReadingsByPlantQuery } from '@contexts/sensor-readings/application/queries/find-latest-readings-by-plant/find-latest-readings-by-plant.query';
import { SensorReadingViewModel } from '@contexts/sensor-readings/domain/view-models/sensor-reading.view-model';

import { sensorReadingFindLatestSchema } from '../schemas/sensor-reading-find-latest.schema';

@McpTool()
@Injectable()
export class SensorReadingFindLatestMcpTool implements IMcpTool {
  private readonly logger = new Logger(SensorReadingFindLatestMcpTool.name);

  readonly name = 'sensor_reading_find_latest';
  readonly title = 'Latest sensor readings';
  readonly description =
    'Returns the latest reading per metric for a plant in the current space.';
  readonly inputSchema = sensorReadingFindLatestSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { plantId } = args as { plantId: string };
    this.logger.log(`Finding latest readings for plant ${plantId}`);

    const readings = await this.queryBus.execute<
      FindLatestReadingsByPlantQuery,
      SensorReadingViewModel[]
    >(new FindLatestReadingsByPlantQuery({ plantId }));

    return { content: [{ type: 'text', text: JSON.stringify(readings) }] };
  }
}
