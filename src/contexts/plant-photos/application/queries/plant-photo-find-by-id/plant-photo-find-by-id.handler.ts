import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertPlantPhotoViewModelExistsService } from '@contexts/plant-photos/application/services/read/assert-plant-photo-view-model-exists/assert-plant-photo-view-model-exists.service';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';

import { PlantPhotoFindByIdQuery } from './plant-photo-find-by-id.query';

@QueryHandler(PlantPhotoFindByIdQuery)
export class PlantPhotoFindByIdQueryHandler implements IQueryHandler<
  PlantPhotoFindByIdQuery,
  PlantPhotoViewModel
> {
  private readonly logger = new Logger(PlantPhotoFindByIdQueryHandler.name);

  constructor(
    private readonly assertPlantPhotoViewModelExistsService: AssertPlantPhotoViewModelExistsService,
  ) {}

  async execute(query: PlantPhotoFindByIdQuery): Promise<PlantPhotoViewModel> {
    this.logger.log(
      `Executing PlantPhotoFindByIdQuery for plant photo ${query.id.value}`,
    );
    return this.assertPlantPhotoViewModelExistsService.execute(query.id);
  }
}
