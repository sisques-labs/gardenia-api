import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { SpaceInvitationAggregate } from '@contexts/spaces/domain/aggregates/space-invitation.aggregate';
import { ISpaceInvitationWriteRepository } from '@contexts/spaces/domain/repositories/write/space-invitation-write.repository';
import { InvitationCodeValueObject } from '@contexts/spaces/domain/value-objects/invitation-code/invitation-code.value-object';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { SpaceInvitationEntity } from '../entities/space-invitation.entity';
import { SpaceInvitationTypeOrmMapper } from '../mappers/space-invitation-typeorm.mapper';

@Injectable()
export class SpaceInvitationTypeOrmWriteRepository implements ISpaceInvitationWriteRepository {
  private readonly repository: Repository<SpaceInvitationEntity>;
  private readonly rawRepo: Repository<SpaceInvitationEntity>;

  constructor(
    private readonly mapper: SpaceInvitationTypeOrmMapper,
    @InjectRepository(SpaceInvitationEntity)
    rawRepo: Repository<SpaceInvitationEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    this.rawRepo = rawRepo;
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<SpaceInvitationAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByCode(code: string): Promise<SpaceInvitationAggregate | null> {
    const normalized = InvitationCodeValueObject.normalize(code);
    const entity = await this.rawRepo.findOne({ where: { code: normalized } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async save(
    invitation: SpaceInvitationAggregate,
  ): Promise<SpaceInvitationAggregate> {
    const entity = this.mapper.toEntity(invitation);
    await this.repository.save(entity);
    return this.mapper.toAggregate(entity as SpaceInvitationEntity);
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<SpaceInvitationAggregate>> {
    throw new Error('Method not implemented.');
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
