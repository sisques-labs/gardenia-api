import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Criteria } from '@sisques-labs/nestjs-kit';

import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { fetchAllPages } from '@shared/pagination/fetch-all-pages.util';

import { SpaceFindAllIdsQuery } from './space-find-all-ids.query';

const PAGE_SIZE = 200;

@QueryHandler(SpaceFindAllIdsQuery)
export class SpaceFindAllIdsQueryHandler implements IQueryHandler<
  SpaceFindAllIdsQuery,
  string[]
> {
  private readonly logger = new Logger(SpaceFindAllIdsQueryHandler.name);

  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
  ) {}

  async execute(_query: SpaceFindAllIdsQuery): Promise<string[]> {
    this.logger.log('Executing SpaceFindAllIdsQuery');

    const spaces = await fetchAllPages(
      (page, perPage) =>
        this.spaceReadRepository.findByCriteria(
          new Criteria([], [], { page, perPage }),
        ),
      PAGE_SIZE,
    );

    return spaces.map((space) => space.id);
  }
}
