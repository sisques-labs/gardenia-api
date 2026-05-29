import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '../../aggregates/space.aggregate';

export const SPACE_WRITE_REPOSITORY = Symbol('SPACE_WRITE_REPOSITORY');

export type ISpaceWriteRepository = IBaseWriteRepository<SpaceAggregate>;
