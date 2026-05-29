import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '../../entities/space-membership.entity';
import { SpaceViewModel } from '../../view-models/space.view-model';

export const MEMBERSHIP_READ_REPOSITORY = Symbol('MEMBERSHIP_READ_REPOSITORY');

export interface IMembershipReadRepository extends IBaseReadRepository<SpaceViewModel> {
  findByUserAndSpace(
    userId: string,
    spaceId: string,
  ): Promise<SpaceMembership | null>;
  countByOwner(userId: string): Promise<number>;
}
