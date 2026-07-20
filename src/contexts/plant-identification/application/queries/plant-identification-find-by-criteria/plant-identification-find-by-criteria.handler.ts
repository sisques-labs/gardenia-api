import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  IPlantIdentificationReadRepository,
  PLANT_IDENTIFICATION_READ_REPOSITORY,
} from '@contexts/plant-identification/domain/repositories/read/plant-identification-read.repository';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';

import { PlantIdentificationFindByCriteriaQuery } from './plant-identification-find-by-criteria.query';

@QueryHandler(PlantIdentificationFindByCriteriaQuery)
export class PlantIdentificationFindByCriteriaQueryHandler implements IQueryHandler<
  PlantIdentificationFindByCriteriaQuery,
  PaginatedResult<PlantIdentificationViewModel>
> {
  private readonly logger = new Logger(
    PlantIdentificationFindByCriteriaQueryHandler.name,
  );

  constructor(
    @Inject(PLANT_IDENTIFICATION_READ_REPOSITORY)
    private readonly readRepository: IPlantIdentificationReadRepository,
  ) {}

  async execute(
    query: PlantIdentificationFindByCriteriaQuery,
  ): Promise<PaginatedResult<PlantIdentificationViewModel>> {
    this.logger.log('Finding plant identifications by criteria');
    return this.readRepository.findByCriteria(query.criteria);
  }
}
