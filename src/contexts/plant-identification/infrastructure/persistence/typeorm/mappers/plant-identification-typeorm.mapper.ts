import { Injectable } from '@nestjs/common';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationBuilder } from '@contexts/plant-identification/domain/builders/plant-identification.builder';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { PlantIdentificationCandidateCommonNameTypeOrmEntity } from '../entities/plant-identification-candidate-common-name.entity';
import { PlantIdentificationCandidateTypeOrmEntity } from '../entities/plant-identification-candidate.entity';
import { PlantIdentificationPhotoTypeOrmEntity } from '../entities/plant-identification-photo.entity';
import { PlantIdentificationTypeOrmEntity } from '../entities/plant-identification.entity';

export interface PlantIdentificationPersistencePayload {
  parent: PlantIdentificationTypeOrmEntity;
  photos: PlantIdentificationPhotoTypeOrmEntity[];
  candidates: PlantIdentificationCandidateTypeOrmEntity[];
  /** One array of common names per entry of `candidates`, same index order. */
  candidateCommonNames: string[][];
}

@Injectable()
export class PlantIdentificationTypeOrmMapper {
  constructor(private readonly builder: PlantIdentificationBuilder) {}

  public toDomain(
    parent: PlantIdentificationTypeOrmEntity,
    photos: PlantIdentificationPhotoTypeOrmEntity[],
    candidates: PlantIdentificationCandidateTypeOrmEntity[],
    commonNames: PlantIdentificationCandidateCommonNameTypeOrmEntity[],
  ): PlantIdentificationAggregate {
    const commonNamesByCandidate =
      this.groupCommonNamesByCandidate(commonNames);

    return this.builder
      .withId(parent.id)
      .withRequestedByUserId(parent.requestedByUserId)
      .withSpaceId(parent.spaceId)
      .withResolved(
        parent.resolvedSpeciesKey != null &&
          parent.resolvedScientificName &&
          parent.resolvedSpeciesProvider
          ? {
              speciesKey: parent.resolvedSpeciesKey,
              scientificName: parent.resolvedScientificName,
              provider: parent.resolvedSpeciesProvider,
            }
          : null,
      )
      .withConvertedToPlantId(parent.convertedToPlantId)
      .withPhotos(
        [...photos]
          .sort((a, b) => a.position - b.position)
          .map((photo) => ({
            fileId: photo.fileId,
            url: photo.url,
            organ: photo.organ as PlantIdentificationOrganEnum,
            position: photo.position,
          })),
      )
      .withCandidates(
        [...candidates]
          .sort((a, b) => a.rank - b.rank)
          .map((candidate) => ({
            scientificName: candidate.scientificName,
            commonNames: commonNamesByCandidate.get(candidate.id) ?? [],
            score: Number(candidate.score),
            rank: candidate.rank,
          })),
      )
      .withCreatedAt(parent.createdAt)
      .withUpdatedAt(parent.updatedAt)
      .build();
  }

  public toPersistence(
    aggregate: PlantIdentificationAggregate,
  ): PlantIdentificationPersistencePayload {
    const p = aggregate.toPrimitives();

    const parent = new PlantIdentificationTypeOrmEntity();
    parent.id = p.id;
    parent.requestedByUserId = p.requestedByUserId;
    parent.spaceId = p.spaceId;
    parent.status = p.status;
    parent.resolvedSpeciesKey = p.resolvedSpeciesKey;
    parent.resolvedScientificName = p.resolvedScientificName;
    parent.resolvedSpeciesProvider = p.resolvedSpeciesProvider;
    parent.convertedToPlantId = p.convertedToPlantId;
    parent.createdAt = p.createdAt;
    parent.updatedAt = p.updatedAt;

    const photos = p.photos.map((photo) => {
      const entity = new PlantIdentificationPhotoTypeOrmEntity();
      entity.plantIdentificationId = p.id;
      entity.fileId = photo.fileId;
      entity.url = photo.url;
      entity.organ = photo.organ;
      entity.position = photo.position;
      return entity;
    });

    const candidates = p.candidates.map((candidate) => {
      const entity = new PlantIdentificationCandidateTypeOrmEntity();
      entity.plantIdentificationId = p.id;
      entity.scientificName = candidate.scientificName;
      entity.score = candidate.score;
      entity.rank = candidate.rank;
      return entity;
    });

    const candidateCommonNames = p.candidates.map(
      (candidate) => candidate.commonNames,
    );

    return { parent, photos, candidates, candidateCommonNames };
  }

  public toViewModel(
    parent: PlantIdentificationTypeOrmEntity,
    photos: PlantIdentificationPhotoTypeOrmEntity[],
    candidates: PlantIdentificationCandidateTypeOrmEntity[],
    commonNames: PlantIdentificationCandidateCommonNameTypeOrmEntity[],
  ): PlantIdentificationViewModel {
    const commonNamesByCandidate =
      this.groupCommonNamesByCandidate(commonNames);

    return this.builder
      .withId(parent.id)
      .withRequestedByUserId(parent.requestedByUserId)
      .withSpaceId(parent.spaceId)
      .withResolved(
        parent.resolvedSpeciesKey != null &&
          parent.resolvedScientificName &&
          parent.resolvedSpeciesProvider
          ? {
              speciesKey: parent.resolvedSpeciesKey,
              scientificName: parent.resolvedScientificName,
              provider: parent.resolvedSpeciesProvider,
            }
          : null,
      )
      .withConvertedToPlantId(parent.convertedToPlantId)
      .withPhotos(
        [...photos]
          .sort((a, b) => a.position - b.position)
          .map((photo) => ({
            fileId: photo.fileId,
            url: photo.url,
            organ: photo.organ as PlantIdentificationOrganEnum,
            position: photo.position,
          })),
      )
      .withCandidates(
        [...candidates]
          .sort((a, b) => a.rank - b.rank)
          .map((candidate) => ({
            scientificName: candidate.scientificName,
            commonNames: commonNamesByCandidate.get(candidate.id) ?? [],
            score: Number(candidate.score),
            rank: candidate.rank,
          })),
      )
      .withCreatedAt(parent.createdAt)
      .withUpdatedAt(parent.updatedAt)
      .buildViewModel();
  }

  private groupCommonNamesByCandidate(
    commonNames: PlantIdentificationCandidateCommonNameTypeOrmEntity[],
  ): Map<string, string[]> {
    const byCandidate = new Map<string, string[]>();
    for (const commonName of [...commonNames].sort(
      (a, b) => a.position - b.position,
    )) {
      const list = byCandidate.get(commonName.candidateId) ?? [];
      list.push(commonName.name);
      byCandidate.set(commonName.candidateId, list);
    }
    return byCandidate;
  }
}
