import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
} from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '../aggregates/space.aggregate';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';
import { SpaceViewModel } from '../view-models/space.view-model';

@Injectable()
export class SpaceBuilder extends BaseBuilder<SpaceAggregate, SpaceViewModel> {
  private _name!: string;
  private _ownerId!: string;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withOwnerId(ownerId: string): this {
    this._ownerId = ownerId;
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
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._name) throw new FieldIsRequiredException('name');
    if (!this._ownerId) throw new FieldIsRequiredException('ownerId');
  }
}
