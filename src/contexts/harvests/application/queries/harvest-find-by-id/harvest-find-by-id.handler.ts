import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertHarvestViewModelExistsService } from '@contexts/harvests/application/services/read/assert-harvest-view-model-exists/assert-harvest-view-model-exists.service';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';

import { HarvestFindByIdQuery } from './harvest-find-by-id.query';

@QueryHandler(HarvestFindByIdQuery)
export class HarvestFindByIdQueryHandler implements IQueryHandler<
  HarvestFindByIdQuery,
  HarvestViewModel
> {
  private readonly logger = new Logger(HarvestFindByIdQueryHandler.name);

  constructor(
    private readonly assertHarvestViewModelExistsService: AssertHarvestViewModelExistsService,
  ) {}

  async execute(query: HarvestFindByIdQuery): Promise<HarvestViewModel> {
    this.logger.log(
      `Executing HarvestFindByIdQuery for harvest ${query.id.value}`,
    );
    return this.assertHarvestViewModelExistsService.execute(query.id);
  }
}
