import {
  BaseAggregate,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAlreadyConvertedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-already-converted.exception';
import { PlantIdentificationConvertedToPlantEvent } from '@contexts/plant-identification/domain/events/plant-identification-converted-to-plant/plant-identification-converted-to-plant.event';
import { PlantIdentificationCreatedEvent } from '@contexts/plant-identification/domain/events/plant-identification-created/plant-identification-created.event';
import { IPlantIdentificationCandidate } from '@contexts/plant-identification/domain/interfaces/plant-identification-candidate.interface';
import { IPlantIdentificationPhoto } from '@contexts/plant-identification/domain/interfaces/plant-identification-photo.interface';
import { IPlantIdentification } from '@contexts/plant-identification/domain/interfaces/plant-identification.interface';
import {
  IPlantIdentificationCandidatePrimitives,
  IPlantIdentificationPhotoPrimitives,
  IPlantIdentificationPrimitives,
} from '@contexts/plant-identification/domain/primitives/plant-identification.primitives';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationSpeciesKeyValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-key/plant-identification-species-key.value-object';
import { PlantIdentificationSpeciesProviderValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-provider/plant-identification-species-provider.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';

/**
 * An identification attempt: one or more submitted photos, PlantNet's ranked
 * candidate list, and (if the top candidate cleared the confidence
 * threshold) a `resolved` species match. Provider-agnostic on purpose —
 * `resolvedSpeciesProvider` records which external catalog resolved it
 * (`"gbif"` today), never hardcoded into a field name. Immutable after
 * creation — the only mutation is `convertToPlant()`, which stamps
 * `convertedToPlantId` once.
 */
export class PlantIdentificationAggregate extends BaseAggregate {
  private readonly _id: PlantIdentificationIdValueObject;
  private readonly _requestedByUserId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;
  private readonly _status: PlantIdentificationStatusValueObject;
  private readonly _resolvedSpeciesKey: PlantIdentificationSpeciesKeyValueObject | null;
  private readonly _resolvedScientificName: StringValueObject | null;
  private readonly _resolvedSpeciesProvider: PlantIdentificationSpeciesProviderValueObject | null;
  private _convertedToPlantId: UuidValueObject | null;
  private readonly _photos: IPlantIdentificationPhoto[];
  private readonly _candidates: IPlantIdentificationCandidate[];

  constructor(props: IPlantIdentification) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._requestedByUserId = props.requestedByUserId;
    this._spaceId = props.spaceId;
    this._status = props.status;
    this._resolvedSpeciesKey = props.resolvedSpeciesKey;
    this._resolvedScientificName = props.resolvedScientificName;
    this._resolvedSpeciesProvider = props.resolvedSpeciesProvider;
    this._convertedToPlantId = props.convertedToPlantId;
    this._photos = props.photos;
    this._candidates = props.candidates;
  }

  public create(): void {
    this.apply(
      new PlantIdentificationCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantIdentificationAggregate.name,
          entityId: this._id.value,
          entityType: PlantIdentificationAggregate.name,
          eventType: PlantIdentificationCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public convertToPlant(plantId: string): void {
    if (this._convertedToPlantId) {
      throw new PlantIdentificationAlreadyConvertedException(this._id.value);
    }

    this._convertedToPlantId = new UuidValueObject(plantId);
    this.touch();

    this.apply(
      new PlantIdentificationConvertedToPlantEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantIdentificationAggregate.name,
          entityId: this._id.value,
          entityType: PlantIdentificationAggregate.name,
          eventType: PlantIdentificationConvertedToPlantEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public toPrimitives(): IPlantIdentificationPrimitives {
    return {
      id: this._id.value,
      requestedByUserId: this._requestedByUserId.value,
      spaceId: this._spaceId.value,
      status: this._status.value as IPlantIdentificationPrimitives['status'],
      resolvedSpeciesKey: this._resolvedSpeciesKey?.value ?? null,
      resolvedScientificName: this._resolvedScientificName?.value ?? null,
      resolvedSpeciesProvider: this._resolvedSpeciesProvider?.value ?? null,
      convertedToPlantId: this._convertedToPlantId?.value ?? null,
      photos: this._photos.map(
        (photo): IPlantIdentificationPhotoPrimitives => ({
          fileId: photo.fileId.value,
          url: photo.url.value,
          organ: photo.organ
            .value as IPlantIdentificationPhotoPrimitives['organ'],
          position: photo.position.value,
        }),
      ),
      candidates: this._candidates.map(
        (candidate): IPlantIdentificationCandidatePrimitives => ({
          scientificName: candidate.scientificName.value,
          commonNames: candidate.commonNames,
          score: candidate.score.value,
          rank: candidate.rank.value,
        }),
      ),
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): PlantIdentificationIdValueObject {
    return this._id;
  }
  get requestedByUserId(): UuidValueObject {
    return this._requestedByUserId;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
  get status(): PlantIdentificationStatusValueObject {
    return this._status;
  }
  get resolvedSpeciesKey(): PlantIdentificationSpeciesKeyValueObject | null {
    return this._resolvedSpeciesKey;
  }
  get resolvedScientificName(): StringValueObject | null {
    return this._resolvedScientificName;
  }
  get resolvedSpeciesProvider(): PlantIdentificationSpeciesProviderValueObject | null {
    return this._resolvedSpeciesProvider;
  }
  get convertedToPlantId(): UuidValueObject | null {
    return this._convertedToPlantId;
  }
  get photos(): IPlantIdentificationPhoto[] {
    return this._photos;
  }
  get candidates(): IPlantIdentificationCandidate[] {
    return this._candidates;
  }
}
