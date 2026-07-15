import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { IPlantIdentificationCandidate } from '@contexts/plant-identification/domain/interfaces/plant-identification-candidate.interface';
import { IPlantIdentificationPhoto } from '@contexts/plant-identification/domain/interfaces/plant-identification-photo.interface';
import {
  IPlantIdentificationCandidatePrimitives,
  IPlantIdentificationPhotoPrimitives,
} from '@contexts/plant-identification/domain/primitives/plant-identification.primitives';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';
import { PlantIdentificationScoreValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-score/plant-identification-score.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';

export interface PlantIdentificationResolvedInput {
  gbifKey: number;
  scientificName: string;
}

@Injectable()
export class PlantIdentificationBuilder extends BaseBuilder<
  PlantIdentificationAggregate,
  PlantIdentificationViewModel
> {
  private _requestedByUserId!: string;
  private _spaceId!: string;
  private _status!: PlantIdentificationStatusEnum;
  private _resolved: PlantIdentificationResolvedInput | null = null;
  private _convertedToPlantId: string | null = null;
  private _photos: IPlantIdentificationPhotoPrimitives[] = [];
  private _candidates: IPlantIdentificationCandidatePrimitives[] = [];

  withRequestedByUserId(requestedByUserId: string): this {
    this._requestedByUserId = requestedByUserId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  withStatus(status: PlantIdentificationStatusEnum): this {
    this._status = status;
    return this;
  }

  withResolved(resolved: PlantIdentificationResolvedInput | null): this {
    this._resolved = resolved;
    return this;
  }

  withConvertedToPlantId(convertedToPlantId: string | null): this {
    this._convertedToPlantId = convertedToPlantId;
    return this;
  }

  withPhotos(photos: IPlantIdentificationPhotoPrimitives[]): this {
    this._photos = photos;
    return this;
  }

  withCandidates(candidates: IPlantIdentificationCandidatePrimitives[]): this {
    this._candidates = candidates;
    return this;
  }

  public override build(): PlantIdentificationAggregate {
    this.validate();

    const photos: IPlantIdentificationPhoto[] = this._photos.map((photo) => ({
      fileId: new UuidValueObject(photo.fileId),
      url: new StringValueObject(photo.url, {
        maxLength: 1024,
        allowEmpty: false,
      }),
      organ: new PlantIdentificationOrganValueObject(photo.organ),
      position: new NumberValueObject(photo.position),
    }));

    const candidates: IPlantIdentificationCandidate[] = this._candidates.map(
      (candidate) => ({
        scientificName: new StringValueObject(candidate.scientificName, {
          maxLength: 300,
          allowEmpty: false,
        }),
        commonNames: candidate.commonNames,
        score: new PlantIdentificationScoreValueObject(candidate.score),
        rank: new NumberValueObject(candidate.rank),
      }),
    );

    return new PlantIdentificationAggregate({
      id: new PlantIdentificationIdValueObject(this._id),
      requestedByUserId: new UuidValueObject(this._requestedByUserId),
      spaceId: new UuidValueObject(this._spaceId),
      status: new PlantIdentificationStatusValueObject(this._status),
      resolvedGbifKey: this._resolved
        ? new NumberValueObject(this._resolved.gbifKey)
        : null,
      resolvedScientificName: this._resolved
        ? new StringValueObject(this._resolved.scientificName, {
            maxLength: 300,
            allowEmpty: false,
          })
        : null,
      convertedToPlantId: this._convertedToPlantId
        ? new UuidValueObject(this._convertedToPlantId)
        : null,
      photos,
      candidates,
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PlantIdentificationViewModel {
    this.validate();
    return new PlantIdentificationViewModel({
      id: this._id,
      requestedByUserId: this._requestedByUserId,
      spaceId: this._spaceId,
      status: this._status,
      resolvedGbifKey: this._resolved?.gbifKey ?? null,
      resolvedScientificName: this._resolved?.scientificName ?? null,
      convertedToPlantId: this._convertedToPlantId,
      photos: this._photos,
      candidates: this._candidates,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._requestedByUserId) {
      throw new FieldIsRequiredException('requestedByUserId');
    }
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._status) throw new FieldIsRequiredException('status');
  }
}
