import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  NumberValueObject,
  StringValueObject,
  UrlValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantingSpotQrAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot-qr.aggregate';
import { PlantingSpotQrViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-qr.view-model';

@Injectable()
export class PlantingSpotQrBuilder extends BaseBuilder<
  PlantingSpotQrAggregate,
  PlantingSpotQrViewModel
> {
  private _spaceId!: string;
  private _targetUrl!: string;
  private _generation!: number;
  private _image!: string;

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  withTargetUrl(targetUrl: string): this {
    this._targetUrl = targetUrl;
    return this;
  }

  withGeneration(generation: number): this {
    this._generation = generation;
    return this;
  }

  withImage(image: string): this {
    this._image = image;
    return this;
  }

  public override build(): PlantingSpotQrAggregate {
    this.validate();
    return new PlantingSpotQrAggregate({
      id: new UuidValueObject(this._id),
      spaceId: new UuidValueObject(this._spaceId),
      targetUrl: new UrlValueObject(this._targetUrl),
      generation: new NumberValueObject(this._generation),
      image: new StringValueObject(this._image),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PlantingSpotQrViewModel {
    this.validate();
    return new PlantingSpotQrViewModel({
      id: this._id,
      spaceId: this._spaceId,
      targetUrl: this._targetUrl,
      generation: this._generation,
      image: this._image,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._targetUrl) throw new FieldIsRequiredException('targetUrl');
    if (this._generation == null)
      throw new FieldIsRequiredException('generation');
    if (!this._image) throw new FieldIsRequiredException('image');
  }
}
