import { Injectable } from '@nestjs/common';

import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';
import { NodeTelemetryReading } from '@contexts/nodes/domain/records/node-telemetry-reading.record';
import { NodeTelemetryReadingViewModel } from '@contexts/nodes/domain/view-models/node-telemetry-reading.view-model';
import { NodeTelemetryReadingTypeOrmEntity } from '../entities/node-telemetry-reading.entity';

@Injectable()
export class NodeTelemetryReadingTypeOrmMapper {
  public toEntity(
    record: NodeTelemetryReading,
  ): NodeTelemetryReadingTypeOrmEntity {
    const entity = new NodeTelemetryReadingTypeOrmEntity();

    entity.id = record.id;
    entity.spaceId = record.spaceId;
    entity.nodeId = record.nodeId;
    entity.sensorType = record.sensorType;
    entity.value = record.value;
    entity.unit = record.unit;
    entity.recordedAt = record.recordedAt;

    return entity;
  }

  public toViewModel(
    entity: NodeTelemetryReadingTypeOrmEntity,
  ): NodeTelemetryReadingViewModel {
    return new NodeTelemetryReadingViewModel({
      id: entity.id,
      spaceId: entity.spaceId,
      nodeId: entity.nodeId,
      sensorType: entity.sensorType as SensorTypeEnum,
      value: Number(entity.value),
      unit: entity.unit,
      recordedAt: entity.recordedAt,
      createdAt: entity.recordedAt,
      updatedAt: entity.recordedAt,
    });
  }
}
