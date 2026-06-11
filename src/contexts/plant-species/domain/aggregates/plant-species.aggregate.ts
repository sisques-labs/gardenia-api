import { BaseAggregate } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesDescriptionChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-description-changed/plant-species-description-changed.event';
import { PlantSpeciesImageUrlChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-image-url-changed/plant-species-image-url-changed.event';
import { PlantSpeciesScientificNameChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-scientific-name-changed/plant-species-scientific-name-changed.event';
import { PlantSpeciesCreatedEvent } from '@contexts/plant-species/domain/events/plant-species-created/plant-species-created.event';
import { PlantSpeciesDeletedEvent } from '@contexts/plant-species/domain/events/plant-species-deleted/plant-species-deleted.event';
import { PlantSpeciesUpdatedEvent } from '@contexts/plant-species/domain/events/plant-species-updated/plant-species-updated.event';
import { IPlantSpecies } from '@contexts/plant-species/domain/interfaces/plant-species.interface';
import { IPlantSpeciesPrimitives } from '@contexts/plant-species/domain/primitives/plant-species.primitives';
import { PlantSpeciesDescriptionValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-description/plant-species-description.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesImageUrlValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-image-url/plant-species-image-url.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export class PlantSpeciesAggregate extends BaseAggregate {
  private readonly _id: PlantSpeciesIdValueObject;
  private _scientificName: PlantSpeciesScientificNameValueObject;
  private _description: PlantSpeciesDescriptionValueObject | null;
  private _imageUrl: PlantSpeciesImageUrlValueObject | null;

  constructor(props: IPlantSpecies) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._scientificName = props.scientificName;
    this._description = props.description;
    this._imageUrl = props.imageUrl;
  }

  public create(): void {
    this.apply(
      new PlantSpeciesCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantSpeciesAggregate.name,
          entityId: this._id.value,
          entityType: PlantSpeciesAggregate.name,
          eventType: PlantSpeciesCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public update(props: {
    scientificName?: PlantSpeciesScientificNameValueObject;
    description?: PlantSpeciesDescriptionValueObject | null;
    imageUrl?: PlantSpeciesImageUrlValueObject | null;
  }): void {
    if (props.scientificName !== undefined) {
      this.changeScientificName(props.scientificName);
    }

    if (props.description !== undefined) {
      this.changeDescription(props.description);
    }

    if (props.imageUrl !== undefined) {
      this.changeImageUrl(props.imageUrl);
    }

    this.apply(
      new PlantSpeciesUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantSpeciesAggregate.name,
          entityId: this._id.value,
          entityType: PlantSpeciesAggregate.name,
          eventType: PlantSpeciesUpdatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  private changeScientificName(
    newScientificName: PlantSpeciesScientificNameValueObject,
  ): void {
    const oldValue = this._scientificName.value;
    const newValue = newScientificName.value;

    if (oldValue === newValue) return;

    this._scientificName = newScientificName;
    this.touch();

    this.apply(
      new PlantSpeciesScientificNameChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantSpeciesAggregate.name,
          entityId: this._id.value,
          entityType: PlantSpeciesAggregate.name,
          eventType: PlantSpeciesScientificNameChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDescription(
    newDescription: PlantSpeciesDescriptionValueObject | null,
  ): void {
    const oldValue = this._description?.value ?? null;
    const newValue = newDescription?.value ?? null;

    if (oldValue === newValue) return;

    this._description = newDescription;
    this.touch();

    this.apply(
      new PlantSpeciesDescriptionChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantSpeciesAggregate.name,
          entityId: this._id.value,
          entityType: PlantSpeciesAggregate.name,
          eventType: PlantSpeciesDescriptionChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeImageUrl(
    newImageUrl: PlantSpeciesImageUrlValueObject | null,
  ): void {
    const oldValue = this._imageUrl?.value ?? null;
    const newValue = newImageUrl?.value ?? null;

    if (oldValue === newValue) return;

    this._imageUrl = newImageUrl;
    this.touch();

    this.apply(
      new PlantSpeciesImageUrlChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantSpeciesAggregate.name,
          entityId: this._id.value,
          entityType: PlantSpeciesAggregate.name,
          eventType: PlantSpeciesImageUrlChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  public delete(): void {
    this.apply(
      new PlantSpeciesDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantSpeciesAggregate.name,
          entityId: this._id.value,
          entityType: PlantSpeciesAggregate.name,
          eventType: PlantSpeciesDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public toPrimitives(): IPlantSpeciesPrimitives {
    return {
      id: this._id.value,
      scientificName: this._scientificName.value,
      description: this._description?.value ?? null,
      imageUrl: this._imageUrl?.value ?? null,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): PlantSpeciesIdValueObject {
    return this._id;
  }

  get scientificName(): PlantSpeciesScientificNameValueObject {
    return this._scientificName;
  }

  get description(): PlantSpeciesDescriptionValueObject | null {
    return this._description;
  }

  get imageUrl(): PlantSpeciesImageUrlValueObject | null {
    return this._imageUrl;
  }
}
