import { BaseAggregate } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesGbifKeyChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-gbif-key-changed/plant-species-gbif-key-changed.event';
import { PlantSpeciesScientificNameChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-scientific-name-changed/plant-species-scientific-name-changed.event';
import { PlantSpeciesCreatedEvent } from '@contexts/plant-species/domain/events/plant-species-created/plant-species-created.event';
import { PlantSpeciesDeletedEvent } from '@contexts/plant-species/domain/events/plant-species-deleted/plant-species-deleted.event';
import { PlantSpeciesUpdatedEvent } from '@contexts/plant-species/domain/events/plant-species-updated/plant-species-updated.event';
import { IPlantSpecies } from '@contexts/plant-species/domain/interfaces/plant-species.interface';
import { IPlantSpeciesPrimitives } from '@contexts/plant-species/domain/primitives/plant-species.primitives';
import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export class PlantSpeciesAggregate extends BaseAggregate {
  private readonly _id: PlantSpeciesIdValueObject;
  private _scientificName: PlantSpeciesScientificNameValueObject;
  private _gbifKey: PlantSpeciesGbifKeyValueObject | null;

  constructor(props: IPlantSpecies) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._scientificName = props.scientificName;
    this._gbifKey = props.gbifKey;
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
    gbifKey?: PlantSpeciesGbifKeyValueObject | null;
  }): void {
    if (props.scientificName !== undefined) {
      this.changeScientificName(props.scientificName);
    }

    if (props.gbifKey !== undefined) {
      this.changeGbifKey(props.gbifKey);
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

  private changeGbifKey(
    newGbifKey: PlantSpeciesGbifKeyValueObject | null,
  ): void {
    const oldValue = this._gbifKey?.value ?? null;
    const newValue = newGbifKey?.value ?? null;

    if (oldValue === newValue) return;

    this._gbifKey = newGbifKey;
    this.touch();

    this.apply(
      new PlantSpeciesGbifKeyChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantSpeciesAggregate.name,
          entityId: this._id.value,
          entityType: PlantSpeciesAggregate.name,
          eventType: PlantSpeciesGbifKeyChangedEvent.name,
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
      gbifKey: this._gbifKey?.value ?? null,
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

  get gbifKey(): PlantSpeciesGbifKeyValueObject | null {
    return this._gbifKey;
  }
}
