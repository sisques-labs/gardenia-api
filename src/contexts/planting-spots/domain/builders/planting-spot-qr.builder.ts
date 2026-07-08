import { Injectable } from '@nestjs/common';
import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantingSpotQrViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-qr.view-model';

@Injectable()
export class PlantingSpotQrBuilder {
  private _id!: string;
  private _spaceId!: string;
  private _targetUrl!: string;
  private _generation!: number;
  private _image!: string;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  withId(id: string): this {
    this._id = id;
    return this;
  }

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

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  buildViewModel(): PlantingSpotQrViewModel {
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

  private validate(): void {
    if (!this._id) throw new FieldIsRequiredException('id');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._targetUrl) throw new FieldIsRequiredException('targetUrl');
    if (this._generation == null)
      throw new FieldIsRequiredException('generation');
    if (!this._image) throw new FieldIsRequiredException('image');
    if (!this._createdAt) throw new FieldIsRequiredException('createdAt');
    if (!this._updatedAt) throw new FieldIsRequiredException('updatedAt');
  }
}
