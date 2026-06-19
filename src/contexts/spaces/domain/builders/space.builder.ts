import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
} from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '../aggregates/space.aggregate';
import { SpaceEnvironmentEnum } from '../enums/space-environment.enum';
import { SpaceEnvironmentValueObject } from '../value-objects/space-environment/space-environment.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceLatitudeValueObject } from '../value-objects/space-latitude/space-latitude.value-object';
import { SpaceLongitudeValueObject } from '../value-objects/space-longitude/space-longitude.value-object';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';
import { SpaceViewModel } from '../view-models/space.view-model';

@Injectable()
export class SpaceBuilder extends BaseBuilder<SpaceAggregate, SpaceViewModel> {
  private _name!: string;
  private _ownerId!: string;
  private _latitude: number | null = null;
  private _longitude: number | null = null;
  private _environment: SpaceEnvironmentEnum | null = null;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withOwnerId(ownerId: string): this {
    this._ownerId = ownerId;
    return this;
  }

  withLatitude(latitude: number | null): this {
    this._latitude = latitude;
    return this;
  }

  withLongitude(longitude: number | null): this {
    this._longitude = longitude;
    return this;
  }

  withEnvironment(environment: SpaceEnvironmentEnum | null): this {
    this._environment = environment;
    return this;
  }

  public override build(): SpaceAggregate {
    this.validate();
    return new SpaceAggregate({
      id: new SpaceIdValueObject(this._id),
      name: new SpaceNameValueObject(this._name),
      ownerId: new SpaceIdValueObject(this._ownerId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
      latitude: this._latitude != null ? new SpaceLatitudeValueObject(this._latitude) : null,
      longitude: this._longitude != null ? new SpaceLongitudeValueObject(this._longitude) : null,
      environment: this._environment != null ? new SpaceEnvironmentValueObject(this._environment) : null,
    });
  }

  public override buildViewModel(): SpaceViewModel {
    this.validate();
    return new SpaceViewModel({
      id: this._id,
      name: this._name,
      ownerId: this._ownerId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      latitude: this._latitude,
      longitude: this._longitude,
      environment: this._environment as string | null,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._name) throw new FieldIsRequiredException('name');
    if (!this._ownerId) throw new FieldIsRequiredException('ownerId');
  }
}
