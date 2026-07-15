import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  PLANT_PHOTO_READ_REPOSITORY,
  IPlantPhotoReadRepository,
} from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';

import { PlantPhotoFindByCriteriaQuery } from './plant-photo-find-by-criteria.query';

@QueryHandler(PlantPhotoFindByCriteriaQuery)
export class PlantPhotoFindByCriteriaQueryHandler implements IQueryHandler<
  PlantPhotoFindByCriteriaQuery,
  PaginatedResult<PlantPhotoViewModel>
> {
  private readonly logger = new Logger(
    PlantPhotoFindByCriteriaQueryHandler.name,
  );

  constructor(
    @Inject(PLANT_PHOTO_READ_REPOSITORY)
    private readonly readRepository: IPlantPhotoReadRepository,
  ) {}

  async execute(
    query: PlantPhotoFindByCriteriaQuery,
  ): Promise<PaginatedResult<PlantPhotoViewModel>> {
    this.logger.log('Finding plant photos by criteria');
    return this.readRepository.findByCriteria(query.criteria);
  }
}
