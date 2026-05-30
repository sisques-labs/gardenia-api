import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpacesFindByUserQuery } from './spaces-find-by-user.query';

@QueryHandler(SpacesFindByUserQuery)
export class SpacesFindByUserQueryHandler implements IQueryHandler<
  SpacesFindByUserQuery,
  PaginatedResult<SpaceViewModel>
> {
  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
  ) {}

  async execute(
    query: SpacesFindByUserQuery,
  ): Promise<PaginatedResult<SpaceViewModel>> {
    return this.spaceReadRepository.findByMember(query.userId.value);
  }
}
