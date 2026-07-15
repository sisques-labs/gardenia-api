import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { IPlantIdentificationWriteRepository } from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantIdentificationCandidateTypeOrmEntity } from '../entities/plant-identification-candidate.entity';
import { PlantIdentificationPhotoTypeOrmEntity } from '../entities/plant-identification-photo.entity';
import { PlantIdentificationTypeOrmEntity } from '../entities/plant-identification.entity';
import { PlantIdentificationTypeOrmMapper } from '../mappers/plant-identification-typeorm.mapper';

@Injectable()
export class PlantIdentificationTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements IPlantIdentificationWriteRepository
{
  private readonly repository: Repository<PlantIdentificationTypeOrmEntity>;

  constructor(
    private readonly mapper: PlantIdentificationTypeOrmMapper,
    @InjectRepository(PlantIdentificationTypeOrmEntity)
    rawRepo: Repository<PlantIdentificationTypeOrmEntity>,
    @InjectRepository(PlantIdentificationPhotoTypeOrmEntity)
    private readonly photoRepository: Repository<PlantIdentificationPhotoTypeOrmEntity>,
    @InjectRepository(PlantIdentificationCandidateTypeOrmEntity)
    private readonly candidateRepository: Repository<PlantIdentificationCandidateTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  /**
   * Persists the parent row + its two child collections (photos,
   * candidates) in one transaction. The aggregate is created once and never
   * edits its child collections after creation — delete+reinsert is safe and
   * idempotent on every call (including the second `save()` at conversion
   * time, which only actually changes `convertedToPlantId`/`updatedAt`).
   */
  async save(
    aggregate: PlantIdentificationAggregate,
  ): Promise<PlantIdentificationAggregate> {
    const { parent, photos, candidates } = this.mapper.toPersistence(aggregate);

    await this.repository.manager.transaction(async (manager) => {
      await manager.save(PlantIdentificationTypeOrmEntity, parent);

      await manager.delete(PlantIdentificationPhotoTypeOrmEntity, {
        plantIdentificationId: parent.id,
      });
      if (photos.length > 0) {
        await manager.save(PlantIdentificationPhotoTypeOrmEntity, photos);
      }

      await manager.delete(PlantIdentificationCandidateTypeOrmEntity, {
        plantIdentificationId: parent.id,
      });
      if (candidates.length > 0) {
        await manager.save(
          PlantIdentificationCandidateTypeOrmEntity,
          candidates,
        );
      }
    });

    return aggregate;
  }

  async findById(id: string): Promise<PlantIdentificationAggregate | null> {
    const parent = await this.repository.findOne({ where: { id } });
    if (!parent) return null;

    const [photos, candidates] = await Promise.all([
      this.photoRepository.find({ where: { plantIdentificationId: id } }),
      this.candidateRepository.find({
        where: { plantIdentificationId: id },
      }),
    ]);

    return this.mapper.toDomain(parent, photos, candidates);
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<PlantIdentificationAggregate>> {
    throw new Error('Method not implemented.');
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
