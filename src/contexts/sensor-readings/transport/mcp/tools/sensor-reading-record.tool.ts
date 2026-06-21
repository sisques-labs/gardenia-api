import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/interfaces/mcp-tool-context.interface';
import { RecordSensorReadingCommand } from '@contexts/sensor-readings/application/commands/record-sensor-reading/record-sensor-reading.command';

import { sensorReadingRecordSchema } from '../schemas/sensor-reading-record.schema';

@McpTool()
@Injectable()
export class SensorReadingRecordMcpTool implements IMcpTool {
  private readonly logger = new Logger(SensorReadingRecordMcpTool.name);

  readonly name = 'sensor_reading_record';
  readonly title = 'Record sensor reading';
  readonly description =
    'Records a physical sensor reading (metric + value) for a plant in the current space.';
  readonly inputSchema = sensorReadingRecordSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { plantId, metric, value, unit, measuredAt, source } = args as {
      plantId: string;
      metric: string;
      value: number;
      unit?: string;
      measuredAt?: string;
      source?: string;
    };
    this.logger.log(`Recording ${metric} for plant ${plantId}`);

    const id = await this.commandBus.execute<
      RecordSensorReadingCommand,
      string
    >(
      new RecordSensorReadingCommand({
        plantId,
        spaceId: context.spaceId,
        metric,
        value,
        unit,
        measuredAt: measuredAt ? new Date(measuredAt) : undefined,
        source: source ?? 'mcp',
      }),
    );

    return { content: [{ type: 'text', text: JSON.stringify({ id }) }] };
  }
}
