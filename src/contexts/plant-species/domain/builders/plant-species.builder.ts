import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
} from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

@Injectable()
export class PlantSpeciesBuilder extends BaseBuilder<
  PlantSpeciesAggregate,
  PlantSpeciesViewModel
> {
  private _scientificName!: string;
  private _gbifKey: number | null = null;

  withScientificName(scientificName: string): this {
    this._scientificName = scientificName;
    return this;
  }

  withGbifKey(gbifKey: number | null): this {
    this._gbifKey = gbifKey;
    return this;
  }

  public override build(): PlantSpeciesAggregate {
    this.validate();
    return new PlantSpeciesAggregate({
      id: new PlantSpeciesIdValueObject(this._id),
      scientificName: new PlantSpeciesScientificNameValueObject(
        this._scientificName,
      ),
      gbifKey:
        this._gbifKey != null
          ? new PlantSpeciesGbifKeyValueObject(this._gbifKey)
          : null,
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PlantSpeciesViewModel {
    this.validate();
    return new PlantSpeciesViewModel({
      id: this._id,
      scientificName: this._scientificName,
      gbifKey: this._gbifKey,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._scientificName) {
      throw new FieldIsRequiredException('scientificName');
    }
  }
}
