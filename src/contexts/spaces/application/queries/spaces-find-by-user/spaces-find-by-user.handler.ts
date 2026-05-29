import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';

import { SpacesFindByUserQuery } from './spaces-find-by-user.query';

@QueryHandler(SpacesFindByUserQuery)
export class SpacesFindByUserQueryHandler implements IQueryHandler<
  SpacesFindByUserQuery,
  SpaceAggregate[]
> {
  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
  ) {}

  async execute(query: SpacesFindByUserQuery): Promise<SpaceAggregate[]> {
    return this.spaceReadRepository.findByUserId(query.userId);
  }
}
