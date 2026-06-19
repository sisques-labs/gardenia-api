import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantingSpotPlantAggregate } from '../aggregates/planting-spot-plant.aggregate';
import { PlantingSpotPlantViewModel } from '../view-models/planting-spot-plant.view-model';

@Injectable()
export class PlantingSpotPlantBuilder extends BaseBuilder<
  PlantingSpotPlantAggregate,
  PlantingSpotPlantViewModel
> {
  private _name!: string;
  private _plantSpeciesId: string | null = null;
  private _imageUrl: string | null = null;
  private _userId!: string;
  private _spaceId!: string;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withPlantSpeciesId(plantSpeciesId: string | null): this {
    this._plantSpeciesId = plantSpeciesId;
    return this;
  }

  withImageUrl(imageUrl: string | null): this {
    this._imageUrl = imageUrl;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  public override build(): PlantingSpotPlantAggregate {
    this.validate();
    return new PlantingSpotPlantAggregate({
      id: new UuidValueObject(this._id),
      name: new StringValueObject(this._name),
      plantSpeciesId: this._plantSpeciesId ? new UuidValueObject(this._plantSpeciesId) : null,
      imageUrl: this._imageUrl ? new StringValueObject(this._imageUrl) : null,
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PlantingSpotPlantViewModel {
    this.validate();
    return new PlantingSpotPlantViewModel({
      id: this._id,
      name: this._name,
      plantSpeciesId: this._plantSpeciesId,
      imageUrl: this._imageUrl,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._name) throw new FieldIsRequiredException('name');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
  }
}
