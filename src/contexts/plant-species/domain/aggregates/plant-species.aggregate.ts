import { BaseAggregate } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesCreatedEvent } from '../events/plant-species-created/plant-species-created.event';
import { PlantSpeciesDeletedEvent } from '../events/plant-species-deleted/plant-species-deleted.event';
import { PlantSpeciesUpdatedEvent } from '../events/plant-species-updated/plant-species-updated.event';
import { IPlantSpecies } from '../interfaces/plant-species.interface';
import { IPlantSpeciesPrimitives } from '../primitives/plant-species.primitives';
import { PlantSpeciesIdValueObject } from '../value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesNameValueObject } from '../value-objects/plant-species-name/plant-species-name.value-object';

export class PlantSpeciesAggregate extends BaseAggregate {
  private readonly _id: PlantSpeciesIdValueObject;
  private _name: PlantSpeciesNameValueObject;

  constructor(props: IPlantSpecies) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
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

  public update(props: { name?: PlantSpeciesNameValueObject }): void {
    if (props.name) {
      this._name = props.name;
      this.touch();
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
      name: this._name.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): PlantSpeciesIdValueObject {
    return this._id;
  }

  get name(): PlantSpeciesNameValueObject {
    return this._name;
  }
}
