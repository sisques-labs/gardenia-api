import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertPlantIdentificationViewModelExistsService } from '@contexts/plant-identification/application/services/read/assert-plant-identification-view-model-exists/assert-plant-identification-view-model-exists.service';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';

import { PlantIdentificationFindByIdQuery } from './plant-identification-find-by-id.query';

@QueryHandler(PlantIdentificationFindByIdQuery)
export class PlantIdentificationFindByIdQueryHandler implements IQueryHandler<
  PlantIdentificationFindByIdQuery,
  PlantIdentificationViewModel
> {
  private readonly logger = new Logger(
    PlantIdentificationFindByIdQueryHandler.name,
  );

  constructor(
    private readonly assertPlantIdentificationViewModelExistsService: AssertPlantIdentificationViewModelExistsService,
  ) {}

  async execute(
    query: PlantIdentificationFindByIdQuery,
  ): Promise<PlantIdentificationViewModel> {
    this.logger.log(
      `Executing PlantIdentificationFindByIdQuery for identification ${query.id.value}`,
    );
    return this.assertPlantIdentificationViewModelExistsService.execute(
      query.id,
    );
  }
}
