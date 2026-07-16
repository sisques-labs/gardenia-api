import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { In, Repository } from 'typeorm';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { IPlantIdentificationWriteRepository } from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantIdentificationCandidateCommonNameTypeOrmEntity } from '../entities/plant-identification-candidate-common-name.entity';
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
    @InjectRepository(PlantIdentificationCandidateCommonNameTypeOrmEntity)
    private readonly candidateCommonNameRepository: Repository<PlantIdentificationCandidateCommonNameTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  /**
   * Persists the parent row + its child collections (photos, candidates,
   * and each candidate's common names) in one transaction. The aggregate is
   * created once and never edits its child collections after creation —
   * delete+reinsert is safe and idempotent on every call (including the
   * second `save()` at conversion time, which only actually changes
   * `convertedToPlantId`/`updatedAt`).
   */
  async save(
    aggregate: PlantIdentificationAggregate,
  ): Promise<PlantIdentificationAggregate> {
    const { parent, photos, candidates, candidateCommonNames } =
      this.mapper.toPersistence(aggregate);
    // This save path uses the raw manager (see below) to run a multi-table
    // transaction, bypassing createTenantRepository's automatic `save` trap
    // — so the active space must be stamped explicitly here, exactly like
    // the proxy would otherwise do, instead of trusting the aggregate's own
    // spaceId field.
    parent.spaceId = this.spaceContext.require();

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
        // Common names cascade-delete via the FK to `candidates.id` above —
        // saved here (after the insert) so each row can reference the real
        // DB-generated candidate id.
        const savedCandidates = await manager.save(
          PlantIdentificationCandidateTypeOrmEntity,
          candidates,
        );

        const commonNames = savedCandidates.flatMap((candidate, index) =>
          (candidateCommonNames[index] ?? []).map((name, position) => {
            const entity =
              new PlantIdentificationCandidateCommonNameTypeOrmEntity();
            entity.candidateId = candidate.id;
            entity.name = name;
            entity.position = position;
            return entity;
          }),
        );
        if (commonNames.length > 0) {
          await manager.save(
            PlantIdentificationCandidateCommonNameTypeOrmEntity,
            commonNames,
          );
        }
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

    const commonNames =
      candidates.length > 0
        ? await this.candidateCommonNameRepository.find({
            where: { candidateId: In(candidates.map((c) => c.id)) },
          })
        : [];

    return this.mapper.toDomain(parent, photos, candidates, commonNames);
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
