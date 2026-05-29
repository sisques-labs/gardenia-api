import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertSpaceViewModelExistsService } from '@contexts/spaces/application/services/read/assert-space-view-model-exists/assert-space-view-model-exists.service';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpaceFindByIdQuery } from './space-find-by-id.query';

@QueryHandler(SpaceFindByIdQuery)
export class SpaceFindByIdQueryHandler implements IQueryHandler<
  SpaceFindByIdQuery,
  SpaceViewModel
> {
  constructor(
    private readonly assertSpaceViewModelExistsService: AssertSpaceViewModelExistsService,
  ) {}

  async execute(query: SpaceFindByIdQuery): Promise<SpaceViewModel> {
    return this.assertSpaceViewModelExistsService.execute(query.spaceId);
  }
}
