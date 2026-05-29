import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpaceFindByIdQuery } from './space-find-by-id.query';

@QueryHandler(SpaceFindByIdQuery)
export class SpaceFindByIdQueryHandler implements IQueryHandler<
  SpaceFindByIdQuery,
  SpaceViewModel
> {
  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
  ) {}

  async execute(query: SpaceFindByIdQuery): Promise<SpaceViewModel> {
    const space = await this.spaceReadRepository.findById(query.spaceId.value);

    if (!space) {
      throw new SpaceNotFoundException(query.spaceId.value);
    }

    return space;
  }
}
