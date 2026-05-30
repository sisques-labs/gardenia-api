import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
} from '@sisques-labs/nestjs-kit';

import { PlantAggregate } from '../aggregates/plant.aggregate';
import { PlantIdValueObject } from '../value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '../value-objects/plant-image-url/plant-image-url.value-object';
import { PlantNameValueObject } from '../value-objects/plant-name/plant-name.value-object';
import { PlantSpeciesValueObject } from '../value-objects/plant-species/plant-species.value-object';
import { PlantViewModel } from '../view-models/plant.view-model';

@Injectable()
export class PlantBuilder extends BaseBuilder<PlantAggregate, PlantViewModel> {
  private _name!: string;
  private _species: string | null = null;
  private _imageUrl: string | null = null;
  private _userId!: string;
  private _spaceId!: string;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withSpecies(species: string | null): this {
    this._species = species;
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

  public override build(): PlantAggregate {
    this.validate();
    return new PlantAggregate({
      id: new PlantIdValueObject(this._id),
      name: new PlantNameValueObject(this._name),
      species:
        this._species != null
          ? new PlantSpeciesValueObject(this._species)
          : null,
      imageUrl:
        this._imageUrl != null
          ? new PlantImageUrlValueObject(this._imageUrl)
          : null,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PlantViewModel {
    this.validate();
    return new PlantViewModel({
      id: this._id,
      name: this._name,
      species: this._species,
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
