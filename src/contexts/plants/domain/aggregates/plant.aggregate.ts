import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantImageUrlChangedEvent } from '../events/field-changed/plant-image-url-changed/plant-image-url-changed.event';
import { PlantNameChangedEvent } from '../events/field-changed/plant-name-changed/plant-name-changed.event';
import { PlantSpeciesIdChangedEvent } from '../events/field-changed/plant-species-id-changed/plant-species-id-changed.event';
import { PlantCreatedEvent } from '../events/plant-created/plant-created.event';
import { PlantDeletedEvent } from '../events/plant-deleted/plant-deleted.event';
import { PlantUpdatedEvent } from '../events/plant-updated/plant-updated.event';
import { IPlant } from '../interfaces/plant.interface';
import { IPlantPrimitives } from '../primitives/plant.primitives';
import { PlantIdValueObject } from '../value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '../value-objects/plant-image-url/plant-image-url.value-object';
import { PlantLinkedSpeciesIdValueObject } from '../value-objects/plant-linked-species-id/plant-linked-species-id.value-object';
import { PlantNameValueObject } from '../value-objects/plant-name/plant-name.value-object';

export class PlantAggregate extends BaseAggregate {
  private readonly _id: PlantIdValueObject;
  private _name: PlantNameValueObject;
  private _plantSpeciesId: PlantLinkedSpeciesIdValueObject | null;
  private _imageUrl: PlantImageUrlValueObject | null;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;
  private _qrId: UuidValueObject | null;
  private _plantingSpotId: UuidValueObject | null;

  constructor(props: IPlant) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
    this._plantSpeciesId = props.plantSpeciesId;
    this._imageUrl = props.imageUrl;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
    this._qrId = props.qrId;
    this._plantingSpotId = props.plantingSpotId;
  }

  public linkQr(qrId: UuidValueObject): void {
    this._qrId = qrId;
    this.touch();
  }

  public create(): void {
    this.apply(
      new PlantCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantAggregate.name,
          entityId: this._id.value,
          entityType: PlantAggregate.name,
          eventType: PlantCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public update(props: {
    name?: PlantNameValueObject;
    plantSpeciesId?: PlantLinkedSpeciesIdValueObject | null;
    imageUrl?: PlantImageUrlValueObject | null;
  }): void {
    if (props.name !== undefined) {
      this.changeName(props.name);
    }

    if (props.plantSpeciesId !== undefined) {
      this.changePlantSpeciesId(props.plantSpeciesId);
    }

    if (props.imageUrl !== undefined) {
      this.changeImageUrl(props.imageUrl);
    }

    this.apply(
      new PlantUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantAggregate.name,
          entityId: this._id.value,
          entityType: PlantAggregate.name,
          eventType: PlantUpdatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public delete(): void {
    this.apply(
      new PlantDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantAggregate.name,
          entityId: this._id.value,
          entityType: PlantAggregate.name,
          eventType: PlantDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  private changeName(newName: PlantNameValueObject): void {
    const oldValue = this._name.value;
    const newValue = newName.value;

    if (oldValue === newValue) return;

    this._name = newName;
    this.touch();

    this.apply(
      new PlantNameChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantAggregate.name,
          entityId: this._id.value,
          entityType: PlantAggregate.name,
          eventType: PlantNameChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changePlantSpeciesId(
    newPlantSpeciesId: PlantLinkedSpeciesIdValueObject | null,
  ): void {
    const oldValue = this._plantSpeciesId?.value ?? null;
    const newValue = newPlantSpeciesId?.value ?? null;

    if (oldValue === newValue) return;

    this._plantSpeciesId = newPlantSpeciesId;
    this.touch();

    this.apply(
      new PlantSpeciesIdChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantAggregate.name,
          entityId: this._id.value,
          entityType: PlantAggregate.name,
          eventType: PlantSpeciesIdChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeImageUrl(newImageUrl: PlantImageUrlValueObject | null): void {
    const oldValue = this._imageUrl?.value ?? null;
    const newValue = newImageUrl?.value ?? null;

    if (oldValue === newValue) return;

    this._imageUrl = newImageUrl;
    this.touch();

    this.apply(
      new PlantImageUrlChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantAggregate.name,
          entityId: this._id.value,
          entityType: PlantAggregate.name,
          eventType: PlantImageUrlChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  public toPrimitives(): IPlantPrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      plantSpeciesId: this._plantSpeciesId?.value ?? null,
      imageUrl: this._imageUrl?.value ?? null,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      qrId: this._qrId?.value ?? null,
      plantingSpotId: this._plantingSpotId?.value ?? null,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): PlantIdValueObject {
    return this._id;
  }

  get name(): PlantNameValueObject {
    return this._name;
  }

  get plantSpeciesId(): PlantLinkedSpeciesIdValueObject | null {
    return this._plantSpeciesId;
  }

  get imageUrl(): PlantImageUrlValueObject | null {
    return this._imageUrl;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get spaceId(): UuidValueObject {
    return this._spaceId;
  }

  get qrId(): UuidValueObject | null {
    return this._qrId;
  }

  get plantingSpotId(): UuidValueObject | null {
    return this._plantingSpotId;
  }
}
