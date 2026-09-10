import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { IMembershipWriteRepository } from '@contexts/spaces/domain/repositories/write/membership-write.repository';

import { SpaceMembershipEntity } from '../entities/space-membership.entity';

/**
 * Direct write access to the membership PROJECTION (design.md D4) — used
 * exclusively by `SyncSpaceMembershipProjectionCommandHandler` to reconcile
 * rows from the platform's confirmed response. Deliberately bypasses
 * `SpaceAggregate`/`ISpaceWriteRepository`: see `IMembershipWriteRepository`
 * for why a projection sync must not go through domain business invariants.
 */
@Injectable()
export class SpaceMembershipTypeOrmWriteRepository implements IMembershipWriteRepository {
  constructor(
    @InjectRepository(SpaceMembershipEntity)
    private readonly membershipRepo: Repository<SpaceMembershipEntity>,
  ) {}

  async upsert(
    userId: string,
    spaceId: string,
    role: MembershipRoleEnum,
    syncedAt: Date,
  ): Promise<void> {
    const existing = await this.membershipRepo.findOne({
      where: { userId, spaceId },
    });

    if (existing) {
      existing.role = role;
      existing.syncedAt = syncedAt;
      await this.membershipRepo.save(existing);
      return;
    }

    const entity = new SpaceMembershipEntity();
    entity.userId = userId;
    entity.spaceId = spaceId;
    entity.role = role;
    entity.joinedAt = new Date();
    entity.syncedAt = syncedAt;
    await this.membershipRepo.save(entity);
  }

  async deleteByUserAndSpace(userId: string, spaceId: string): Promise<void> {
    await this.membershipRepo.delete({ userId, spaceId });
  }
}
