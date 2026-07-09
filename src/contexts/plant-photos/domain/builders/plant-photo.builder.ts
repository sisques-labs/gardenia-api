import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';

@Injectable()
export class PlantPhotoBuilder extends BaseBuilder<
  PlantPhotoAggregate,
  PlantPhotoViewModel
> {
  private _plantId!: string;
  private _fileId!: string;
  private _url!: string;
  private _userId!: string;
  private _spaceId!: string;

  withPlantId(plantId: string): this {
    this._plantId = plantId;
    return this;
  }

  withFileId(fileId: string): this {
    this._fileId = fileId;
    return this;
  }

  withUrl(url: string): this {
    this._url = url;
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

  public override build(): PlantPhotoAggregate {
    this.validate();
    return new PlantPhotoAggregate({
      id: new PlantPhotoIdValueObject(this._id),
      plantId: new UuidValueObject(this._plantId),
      fileId: new UuidValueObject(this._fileId),
      url: new PlantPhotoUrlValueObject(this._url),
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PlantPhotoViewModel {
    this.validate();
    return new PlantPhotoViewModel({
      id: this._id,
      plantId: this._plantId,
      fileId: this._fileId,
      url: this._url,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._plantId) throw new FieldIsRequiredException('plantId');
    if (!this._fileId) throw new FieldIsRequiredException('fileId');
    if (!this._url) throw new FieldIsRequiredException('url');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
  }
}
