import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';

export const SPACE_READ_REPOSITORY = Symbol('SPACE_READ_REPOSITORY');

export interface ISpaceReadRepository {
  findById(id: string): Promise<SpaceAggregate | null>;
  findByUserId(userId: string): Promise<SpaceAggregate[]>;
}
