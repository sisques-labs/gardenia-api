import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantPhotoDeletedEvent } from '@contexts/plant-photos/domain/events/plant-photo-deleted/plant-photo-deleted.event';
import { PlantPhotoUploadedEvent } from '@contexts/plant-photos/domain/events/plant-photo-uploaded/plant-photo-uploaded.event';
import { IPlantPhoto } from '@contexts/plant-photos/domain/interfaces/plant-photo.interface';
import { IPlantPhotoPrimitives } from '@contexts/plant-photos/domain/primitives/plant-photo.primitives';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';

/**
 * A photo associated with a plant — metadata only, the raw bytes live in the
 * `files` context. Immutable: there is no update path; to replace a photo,
 * upload a new one and delete the old one.
 */
export class PlantPhotoAggregate extends BaseAggregate {
  private readonly _id: PlantPhotoIdValueObject;
  private readonly _plantId: UuidValueObject;
  private readonly _fileId: UuidValueObject;
  private readonly _url: PlantPhotoUrlValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: IPlantPhoto) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._plantId = props.plantId;
    this._fileId = props.fileId;
    this._url = props.url;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
  }

  public create(): void {
    this.apply(
      new PlantPhotoUploadedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantPhotoAggregate.name,
          entityId: this._id.value,
          entityType: PlantPhotoAggregate.name,
          eventType: PlantPhotoUploadedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public delete(): void {
    this.apply(
      new PlantPhotoDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantPhotoAggregate.name,
          entityId: this._id.value,
          entityType: PlantPhotoAggregate.name,
          eventType: PlantPhotoDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public toPrimitives(): IPlantPhotoPrimitives {
    return {
      id: this._id.value,
      plantId: this._plantId.value,
      fileId: this._fileId.value,
      url: this._url.value,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): PlantPhotoIdValueObject {
    return this._id;
  }
  get plantId(): UuidValueObject {
    return this._plantId;
  }
  get fileId(): UuidValueObject {
    return this._fileId;
  }
  get url(): PlantPhotoUrlValueObject {
    return this._url;
  }
  get userId(): UuidValueObject {
    return this._userId;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
}
