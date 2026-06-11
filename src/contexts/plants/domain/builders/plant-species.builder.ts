import { Injectable } from '@nestjs/common';
import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesViewModel } from '@contexts/plants/domain/view-models/plant-species.view-model';

@Injectable()
export class PlantSpeciesBuilder {
  private _id!: string;
  private _scientificName!: string;
  private _description: string | null = null;
  private _imageUrl: string | null = null;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  withId(id: string): this {
    this._id = id;
    return this;
  }

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

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  buildViewModel(): PlantSpeciesViewModel {
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

  private validate(): void {
    if (!this._id) throw new FieldIsRequiredException('id');
    if (!this._scientificName)
      throw new FieldIsRequiredException('scientificName');
    if (!this._createdAt) throw new FieldIsRequiredException('createdAt');
    if (!this._updatedAt) throw new FieldIsRequiredException('updatedAt');
  }
}
