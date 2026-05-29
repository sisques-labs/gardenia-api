import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';

import { SpaceFindByIdQuery } from './space-find-by-id.query';

@QueryHandler(SpaceFindByIdQuery)
export class SpaceFindByIdQueryHandler implements IQueryHandler<
  SpaceFindByIdQuery,
  SpaceAggregate
> {
  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
  ) {}

  async execute(query: SpaceFindByIdQuery): Promise<SpaceAggregate> {
    const space = await this.spaceReadRepository.findById(query.spaceId);

    if (!space) {
      throw new SpaceNotFoundException(query.spaceId);
    }

    return space;
  }
}
