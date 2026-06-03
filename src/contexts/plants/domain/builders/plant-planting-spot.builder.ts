import { Injectable } from '@nestjs/common';
import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantPlantingSpotViewModel } from '@contexts/plants/domain/view-models/plant-planting-spot.view-model';

@Injectable()
export class PlantPlantingSpotBuilder {
  private _id!: string;
  private _name!: string;
  private _type!: string;
  private _description: string | null = null;
  private _userId!: string;
  private _spaceId!: string;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  withId(id: string): this {
    this._id = id;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withType(type: string): this {
    this._type = type;
    return this;
  }

  withDescription(description: string | null): this {
    this._description = description;
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

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  buildViewModel(): PlantPlantingSpotViewModel {
    this.validate();
    return new PlantPlantingSpotViewModel({
      id: this._id,
      name: this._name,
      type: this._type,
      description: this._description,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  private validate(): void {
    if (!this._id) throw new FieldIsRequiredException('id');
    if (!this._name) throw new FieldIsRequiredException('name');
    if (!this._type) throw new FieldIsRequiredException('type');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._createdAt) throw new FieldIsRequiredException('createdAt');
    if (!this._updatedAt) throw new FieldIsRequiredException('updatedAt');
  }
}
