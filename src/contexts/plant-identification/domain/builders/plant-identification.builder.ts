import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
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
import { PlantIdentificationCommonNameValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-common-name/plant-identification-common-name.value-object';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';
import { PlantIdentificationPhotoPositionValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-photo-position/plant-identification-photo-position.value-object';
import { PlantIdentificationPhotoUrlValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-photo-url/plant-identification-photo-url.value-object';
import { PlantIdentificationRankValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-rank/plant-identification-rank.value-object';
import { PlantIdentificationResolvedScientificNameValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-resolved-scientific-name/plant-identification-resolved-scientific-name.value-object';
import { PlantIdentificationScientificNameValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-scientific-name/plant-identification-scientific-name.value-object';
import { PlantIdentificationScoreValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-score/plant-identification-score.value-object';
import { PlantIdentificationSpeciesKeyValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-key/plant-identification-species-key.value-object';
import { PlantIdentificationSpeciesProviderValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-provider/plant-identification-species-provider.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';

export interface PlantIdentificationResolvedInput {
  speciesKey: number;
  scientificName: string;
  provider: string;
}

@Injectable()
export class PlantIdentificationBuilder extends BaseBuilder<
  PlantIdentificationAggregate,
  PlantIdentificationViewModel
> {
  private _requestedByUserId!: string;
  private _spaceId!: string;
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

  /**
   * `status` is NOT independently settable — it is always derived from
   * whether `resolved` is present (`RESOLVED` iff non-null, `NO_MATCH`
   * otherwise). This is the aggregate's own invariant: the two facts can
   * never legally disagree, so there is exactly one place that decides it,
   * both on first build (from a fresh PlantNet+species-search outcome) and
   * on reconstruction from persistence (where only `resolved` needs to be
   * passed back in — the stored `status` column is queryable/indexed data,
   * not a second source of truth the aggregate trusts).
   */
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

  private deriveStatus(): PlantIdentificationStatusEnum {
    return this._resolved
      ? PlantIdentificationStatusEnum.RESOLVED
      : PlantIdentificationStatusEnum.NO_MATCH;
  }

  public override build(): PlantIdentificationAggregate {
    this.validate();

    const photos: IPlantIdentificationPhoto[] = this._photos.map((photo) => ({
      fileId: new UuidValueObject(photo.fileId),
      url: new PlantIdentificationPhotoUrlValueObject(photo.url),
      organ: new PlantIdentificationOrganValueObject(photo.organ),
      position: new PlantIdentificationPhotoPositionValueObject(photo.position),
    }));

    const candidates: IPlantIdentificationCandidate[] = this._candidates.map(
      (candidate) => ({
        scientificName: new PlantIdentificationScientificNameValueObject(
          candidate.scientificName,
        ),
        commonNames: candidate.commonNames.map(
          (commonName) =>
            new PlantIdentificationCommonNameValueObject(commonName),
        ),
        score: new PlantIdentificationScoreValueObject(candidate.score),
        rank: new PlantIdentificationRankValueObject(candidate.rank),
      }),
    );

    return new PlantIdentificationAggregate({
      id: new PlantIdentificationIdValueObject(this._id),
      requestedByUserId: new UuidValueObject(this._requestedByUserId),
      spaceId: new UuidValueObject(this._spaceId),
      status: new PlantIdentificationStatusValueObject(this.deriveStatus()),
      resolvedSpeciesKey: this._resolved
        ? new PlantIdentificationSpeciesKeyValueObject(
            this._resolved.speciesKey,
          )
        : null,
      resolvedScientificName: this._resolved
        ? new PlantIdentificationResolvedScientificNameValueObject(
            this._resolved.scientificName,
          )
        : null,
      resolvedSpeciesProvider: this._resolved
        ? new PlantIdentificationSpeciesProviderValueObject(
            this._resolved.provider,
          )
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
      status: this.deriveStatus(),
      resolvedSpeciesKey: this._resolved?.speciesKey ?? null,
      resolvedScientificName: this._resolved?.scientificName ?? null,
      resolvedSpeciesProvider: this._resolved?.provider ?? null,
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
  }
}
