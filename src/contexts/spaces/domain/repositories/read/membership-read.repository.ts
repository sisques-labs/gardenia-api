import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';

export const MEMBERSHIP_READ_REPOSITORY = Symbol('MEMBERSHIP_READ_REPOSITORY');

export interface IMembershipReadRepository {
  findByUserAndSpace(
    userId: string,
    spaceId: string,
  ): Promise<SpaceMembership | null>;
  countByOwner(userId: string): Promise<number>;
}
