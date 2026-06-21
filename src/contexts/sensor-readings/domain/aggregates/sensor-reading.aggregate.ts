import {
  BaseAggregate,
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { ISensorReading } from '@contexts/sensor-readings/domain/interfaces/sensor-reading.interface';
import { ISensorReadingPrimitives } from '@contexts/sensor-readings/domain/primitives/sensor-reading.primitives';
import { SensorMetricValueObject } from '@contexts/sensor-readings/domain/value-objects/sensor-metric/sensor-metric.value-object';
import { SensorReadingIdValueObject } from '@contexts/sensor-readings/domain/value-objects/sensor-reading-id/sensor-reading-id.value-object';

/**
 * An immutable physical measurement recorded against a plant (ingested from
 * Home Assistant). Append-only telemetry — once recorded it is never mutated.
 */
export class SensorReadingAggregate extends BaseAggregate {
  private readonly _id: SensorReadingIdValueObject;
  private readonly _plantId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;
  private readonly _metric: SensorMetricValueObject;
  private readonly _value: NumberValueObject;
  private readonly _unit: StringValueObject;
  private readonly _measuredAt: DateValueObject;
  private readonly _source: StringValueObject;

  constructor(props: ISensorReading) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._plantId = props.plantId;
    this._spaceId = props.spaceId;
    this._metric = props.metric;
    this._value = props.value;
    this._unit = props.unit;
    this._measuredAt = props.measuredAt;
    this._source = props.source;
  }

  get id(): SensorReadingIdValueObject {
    return this._id;
  }

  get plantId(): UuidValueObject {
    return this._plantId;
  }

  get spaceId(): UuidValueObject {
    return this._spaceId;
  }

  get metric(): SensorMetricValueObject {
    return this._metric;
  }

  get value(): NumberValueObject {
    return this._value;
  }

  get unit(): StringValueObject {
    return this._unit;
  }

  get measuredAt(): DateValueObject {
    return this._measuredAt;
  }

  get source(): StringValueObject {
    return this._source;
  }

  toPrimitives(): ISensorReadingPrimitives {
    return {
      id: this._id.value,
      plantId: this._plantId.value,
      spaceId: this._spaceId.value,
      metric: this._metric.value,
      value: this._value.value,
      unit: this._unit.value,
      measuredAt: this._measuredAt.value,
      source: this._source.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
