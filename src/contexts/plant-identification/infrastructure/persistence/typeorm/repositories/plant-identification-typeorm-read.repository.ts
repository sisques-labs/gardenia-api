import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { applyCriteriaToQueryBuilder } from '@sisques-labs/nestjs-kit/typeorm';
import { In, Repository } from 'typeorm';

import { IPlantIdentificationReadRepository } from '@contexts/plant-identification/domain/repositories/read/plant-identification-read.repository';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantIdentificationCandidateTypeOrmEntity } from '../entities/plant-identification-candidate.entity';
import { PlantIdentificationPhotoTypeOrmEntity } from '../entities/plant-identification-photo.entity';
import { PlantIdentificationTypeOrmEntity } from '../entities/plant-identification.entity';
import { PlantIdentificationTypeOrmMapper } from '../mappers/plant-identification-typeorm.mapper';

const ALIAS = 'identification';

@Injectable()
export class PlantIdentificationTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPlantIdentificationReadRepository
{
  private readonly repository: Repository<PlantIdentificationTypeOrmEntity>;

  constructor(
    @InjectRepository(PlantIdentificationTypeOrmEntity)
    rawRepo: Repository<PlantIdentificationTypeOrmEntity>,
    @InjectRepository(PlantIdentificationPhotoTypeOrmEntity)
    private readonly photoRepository: Repository<PlantIdentificationPhotoTypeOrmEntity>,
    @InjectRepository(PlantIdentificationCandidateTypeOrmEntity)
    private readonly candidateRepository: Repository<PlantIdentificationCandidateTypeOrmEntity>,
    private readonly mapper: PlantIdentificationTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<PlantIdentificationViewModel | null> {
    const parent = await this.repository.findOne({ where: { id } });
    if (!parent) return null;

    const [photosByParent, candidatesByParent] = await this.loadChildren([
      parent.id,
    ]);

    return this.mapper.toViewModel(
      parent,
      photosByParent.get(parent.id) ?? [],
      candidatesByParent.get(parent.id) ?? [],
    );
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantIdentificationViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    // createQueryBuilder bypasses the tenant-scoping proxy — add the
    // space_id condition explicitly as the first clause.
    const qb = this.repository
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.space_id = :spaceId`, {
        spaceId: this.spaceContext.require(),
      })
      .skip(skip)
      .take(limit);

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
    });

    const [entities, total] = await qb.getManyAndCount();
    if (entities.length === 0) {
      return new PaginatedResult([], total, page, limit);
    }

    const ids = entities.map((entity) => entity.id);
    const [photosByParent, candidatesByParent] = await this.loadChildren(ids);

    const items = entities.map((entity) =>
      this.mapper.toViewModel(
        entity,
        photosByParent.get(entity.id) ?? [],
        candidatesByParent.get(entity.id) ?? [],
      ),
    );

    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: PlantIdentificationViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private async loadChildren(
    parentIds: string[],
  ): Promise<
    [
      Map<string, PlantIdentificationPhotoTypeOrmEntity[]>,
      Map<string, PlantIdentificationCandidateTypeOrmEntity[]>,
    ]
  > {
    const [photos, candidates] = await Promise.all([
      this.photoRepository.find({
        where: { plantIdentificationId: In(parentIds) },
      }),
      this.candidateRepository.find({
        where: { plantIdentificationId: In(parentIds) },
      }),
    ]);

    const photosByParent = new Map<
      string,
      PlantIdentificationPhotoTypeOrmEntity[]
    >();
    for (const photo of photos) {
      const list = photosByParent.get(photo.plantIdentificationId) ?? [];
      list.push(photo);
      photosByParent.set(photo.plantIdentificationId, list);
    }

    const candidatesByParent = new Map<
      string,
      PlantIdentificationCandidateTypeOrmEntity[]
    >();
    for (const candidate of candidates) {
      const list =
        candidatesByParent.get(candidate.plantIdentificationId) ?? [];
      list.push(candidate);
      candidatesByParent.set(candidate.plantIdentificationId, list);
    }

    return [photosByParent, candidatesByParent];
  }
}
