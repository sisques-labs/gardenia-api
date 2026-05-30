import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantImageUrlChangedEvent } from '../events/field-changed/plant-image-url-changed/plant-image-url-changed.event';
import { PlantNameChangedEvent } from '../events/field-changed/plant-name-changed/plant-name-changed.event';
import { PlantSpeciesChangedEvent } from '../events/field-changed/plant-species-changed/plant-species-changed.event';
import { PlantCreatedEvent } from '../events/plant-created/plant-created.event';
import { PlantDeletedEvent } from '../events/plant-deleted/plant-deleted.event';
import { PlantUpdatedEvent } from '../events/plant-updated/plant-updated.event';
import { IPlant } from '../interfaces/plant.interface';
import { IPlantPrimitives } from '../primitives/plant.primitives';
import { PlantIdValueObject } from '../value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '../value-objects/plant-image-url/plant-image-url.value-object';
import { PlantNameValueObject } from '../value-objects/plant-name/plant-name.value-object';
import { PlantSpeciesValueObject } from '../value-objects/plant-species/plant-species.value-object';

export class PlantAggregate extends BaseAggregate {
  private readonly _id: PlantIdValueObject;
  private _name: PlantNameValueObject;
  private _species: PlantSpeciesValueObject | null;
  private _imageUrl: PlantImageUrlValueObject | null;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: IPlant) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
    this._species = props.species;
    this._imageUrl = props.imageUrl;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
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
    species?: PlantSpeciesValueObject | null;
    imageUrl?: PlantImageUrlValueObject | null;
  }): void {
    if (props.name !== undefined) {
      this.changeName(props.name);
    }

    if (props.species !== undefined) {
      this.changeSpecies(props.species);
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

  private changeSpecies(newSpecies: PlantSpeciesValueObject | null): void {
    const oldValue = this._species?.value ?? null;
    const newValue = newSpecies?.value ?? null;

    if (oldValue === newValue) return;

    this._species = newSpecies;
    this.touch();

    this.apply(
      new PlantSpeciesChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantAggregate.name,
          entityId: this._id.value,
          entityType: PlantAggregate.name,
          eventType: PlantSpeciesChangedEvent.name,
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
      species: this._species?.value ?? null,
      imageUrl: this._imageUrl?.value ?? null,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
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

  get species(): PlantSpeciesValueObject | null {
    return this._species;
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
}
