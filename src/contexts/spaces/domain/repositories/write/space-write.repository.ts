import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';

export const SPACE_WRITE_REPOSITORY = Symbol('SPACE_WRITE_REPOSITORY');

export interface ISpaceWriteRepository {
  save(space: SpaceAggregate): Promise<void>;
}
