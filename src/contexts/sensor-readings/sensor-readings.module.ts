import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecordSensorReadingCommandHandler } from '@contexts/sensor-readings/application/commands/record-sensor-reading/record-sensor-reading.handler';
import { FindLatestReadingsByPlantQueryHandler } from '@contexts/sensor-readings/application/queries/find-latest-readings-by-plant/find-latest-readings-by-plant.handler';
import { SensorReadingBuilder } from '@contexts/sensor-readings/domain/builders/sensor-reading.builder';
import { SENSOR_READING_READ_REPOSITORY } from '@contexts/sensor-readings/domain/repositories/read/sensor-reading-read.repository';
import { SENSOR_READING_WRITE_REPOSITORY } from '@contexts/sensor-readings/domain/repositories/write/sensor-reading-write.repository';
import { SensorReadingTypeOrmEntity } from '@contexts/sensor-readings/infrastructure/persistence/typeorm/entities/sensor-reading.entity';
import { SensorReadingTypeOrmMapper } from '@contexts/sensor-readings/infrastructure/persistence/typeorm/mappers/sensor-reading-typeorm.mapper';
import { SensorReadingTypeOrmReadRepository } from '@contexts/sensor-readings/infrastructure/persistence/typeorm/repositories/sensor-reading-typeorm-read.repository';
import { SensorReadingTypeOrmWriteRepository } from '@contexts/sensor-readings/infrastructure/persistence/typeorm/repositories/sensor-reading-typeorm-write.repository';
import { SensorReadingFindLatestMcpTool } from '@contexts/sensor-readings/transport/mcp/tools/sensor-reading-find-latest.tool';
import { SensorReadingRecordMcpTool } from '@contexts/sensor-readings/transport/mcp/tools/sensor-reading-record.tool';

const COMMAND_HANDLERS = [RecordSensorReadingCommandHandler];
const QUERY_HANDLERS = [FindLatestReadingsByPlantQueryHandler];
const DOMAIN_BUILDERS = [SensorReadingBuilder];
const INFRASTRUCTURE_MAPPERS = [SensorReadingTypeOrmMapper];
const INFRASTRUCTURE_ENTITIES = [SensorReadingTypeOrmEntity];
const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: SENSOR_READING_WRITE_REPOSITORY,
    useClass: SensorReadingTypeOrmWriteRepository,
  },
  {
    provide: SENSOR_READING_READ_REPOSITORY,
    useClass: SensorReadingTypeOrmReadRepository,
  },
];
const MCP_TOOLS = [SensorReadingRecordMcpTool, SensorReadingFindLatestMcpTool];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...MCP_TOOLS,
  ],
})
export class SensorReadingsModule {}
