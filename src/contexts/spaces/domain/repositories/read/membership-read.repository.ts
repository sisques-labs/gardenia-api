import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '../../entities/space-membership.entity';

export const MEMBERSHIP_READ_REPOSITORY = Symbol('MEMBERSHIP_READ_REPOSITORY');

export interface IMembershipReadRepository extends IBaseReadRepository<SpaceMembership> {
  countByOwner(userId: string): Promise<number>;
}
