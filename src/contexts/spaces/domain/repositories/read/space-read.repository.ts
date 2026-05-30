import { IBaseReadRepository, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { SpaceViewModel } from '../../view-models/space.view-model';

export const SPACE_READ_REPOSITORY = Symbol('SPACE_READ_REPOSITORY');

export interface ISpaceReadRepository extends IBaseReadRepository<SpaceViewModel> {
  findByMember(userId: string): Promise<PaginatedResult<SpaceViewModel>>;
}
