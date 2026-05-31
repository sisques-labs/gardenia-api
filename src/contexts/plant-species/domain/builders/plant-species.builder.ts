import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
} from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-name/plant-species-name.value-object';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

@Injectable()
export class PlantSpeciesBuilder extends BaseBuilder<
  PlantSpeciesAggregate,
  PlantSpeciesViewModel
> {
  private _name!: string;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  public override build(): PlantSpeciesAggregate {
    this.validate();
    return new PlantSpeciesAggregate({
      id: new PlantSpeciesIdValueObject(this._id),
      name: new PlantSpeciesNameValueObject(this._name),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PlantSpeciesViewModel {
    this.validate();
    return new PlantSpeciesViewModel({
      id: this._id,
      name: this._name,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._name) throw new FieldIsRequiredException('name');
  }
}
