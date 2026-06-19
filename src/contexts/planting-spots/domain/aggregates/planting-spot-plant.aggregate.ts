import { BaseAggregate, StringValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPlant } from '../interfaces/planting-spot-plant.interface';
import { IPlantingSpotPlantPrimitives } from '../primitives/planting-spot-plant.primitives';

export class PlantingSpotPlantAggregate extends BaseAggregate {
  private readonly _id: UuidValueObject;
  private readonly _name: StringValueObject;
  private readonly _plantSpeciesId: UuidValueObject | null;
  private readonly _imageUrl: StringValueObject | null;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: IPlantingSpotPlant) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
    this._plantSpeciesId = props.plantSpeciesId;
    this._imageUrl = props.imageUrl;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
  }

  public toPrimitives(): IPlantingSpotPlantPrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      plantSpeciesId: this._plantSpeciesId?.value ?? null,
      imageUrl: this._imageUrl?.value ?? null,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): UuidValueObject { return this._id; }
  get name(): StringValueObject { return this._name; }
  get plantSpeciesId(): UuidValueObject | null { return this._plantSpeciesId; }
  get imageUrl(): StringValueObject | null { return this._imageUrl; }
  get userId(): UuidValueObject { return this._userId; }
  get spaceId(): UuidValueObject { return this._spaceId; }
}
