import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
} from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesDescriptionValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-description/plant-species-description.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesImageUrlValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-image-url/plant-species-image-url.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

@Injectable()
export class PlantSpeciesBuilder extends BaseBuilder<
  PlantSpeciesAggregate,
  PlantSpeciesViewModel
> {
  private _scientificName!: string;
  private _description: string | null = null;
  private _imageUrl: string | null = null;

  withScientificName(scientificName: string): this {
    this._scientificName = scientificName;
    return this;
  }

  withDescription(description: string | null): this {
    this._description = description;
    return this;
  }

  withImageUrl(imageUrl: string | null): this {
    this._imageUrl = imageUrl;
    return this;
  }

  public override build(): PlantSpeciesAggregate {
    this.validate();
    return new PlantSpeciesAggregate({
      id: new PlantSpeciesIdValueObject(this._id),
      scientificName: new PlantSpeciesScientificNameValueObject(
        this._scientificName,
      ),
      description:
        this._description != null
          ? new PlantSpeciesDescriptionValueObject(this._description)
          : null,
      imageUrl:
        this._imageUrl != null
          ? new PlantSpeciesImageUrlValueObject(this._imageUrl)
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
      description: this._description,
      imageUrl: this._imageUrl,
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
