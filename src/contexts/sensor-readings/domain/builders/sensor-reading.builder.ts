import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { SensorReadingAggregate } from '@contexts/sensor-readings/domain/aggregates/sensor-reading.aggregate';
import { SensorReadingViewModel } from '@contexts/sensor-readings/domain/view-models/sensor-reading.view-model';
import { SensorMetricValueObject } from '@contexts/sensor-readings/domain/value-objects/sensor-metric/sensor-metric.value-object';
import { SensorReadingIdValueObject } from '@contexts/sensor-readings/domain/value-objects/sensor-reading-id/sensor-reading-id.value-object';

@Injectable()
export class SensorReadingBuilder extends BaseBuilder<
  SensorReadingAggregate,
  SensorReadingViewModel
> {
  private _plantId!: string;
  private _spaceId!: string;
  private _metric!: string;
  private _value!: number;
  private _unit = '';
  private _measuredAt!: Date;
  private _source = '';

  withPlantId(plantId: string): this {
    this._plantId = plantId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  withMetric(metric: string): this {
    this._metric = metric;
    return this;
  }

  withValue(value: number): this {
    this._value = value;
    return this;
  }

  withUnit(unit: string): this {
    this._unit = unit;
    return this;
  }

  withMeasuredAt(measuredAt: Date): this {
    this._measuredAt = measuredAt;
    return this;
  }

  withSource(source: string): this {
    this._source = source;
    return this;
  }

  public override build(): SensorReadingAggregate {
    this._createdAt = this._createdAt ?? new Date();
    this._updatedAt = this._updatedAt ?? new Date();
    this.validate();

    return new SensorReadingAggregate({
      id: new SensorReadingIdValueObject(this._id),
      plantId: new UuidValueObject(this._plantId),
      spaceId: new UuidValueObject(this._spaceId),
      metric: new SensorMetricValueObject(this._metric),
      value: new NumberValueObject(this._value),
      unit: new StringValueObject(this._unit),
      measuredAt: new DateValueObject(this._measuredAt),
      source: new StringValueObject(this._source),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): SensorReadingViewModel {
    this._createdAt = this._createdAt ?? new Date();
    this._updatedAt = this._updatedAt ?? new Date();
    this.validate();

    return new SensorReadingViewModel({
      id: this._id,
      plantId: this._plantId,
      spaceId: this._spaceId,
      metric: this._metric,
      value: this._value,
      unit: this._unit,
      measuredAt: this._measuredAt,
      source: this._source,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._plantId) throw new FieldIsRequiredException('plantId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._metric) throw new FieldIsRequiredException('metric');
    if (this._value === undefined || this._value === null) {
      throw new FieldIsRequiredException('value');
    }
    if (!this._measuredAt) throw new FieldIsRequiredException('measuredAt');
  }
}
