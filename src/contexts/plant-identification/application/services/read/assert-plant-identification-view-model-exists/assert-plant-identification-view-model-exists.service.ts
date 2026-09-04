import { Inject, Injectable } from '@nestjs/common';

import { PlantIdentificationNotFoundException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-found.exception';
import {
  IPlantIdentificationReadRepository,
  PLANT_IDENTIFICATION_READ_REPOSITORY,
} from '@contexts/plant-identification/domain/repositories/read/plant-identification-read.repository';

import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertPlantIdentificationViewModelExistsService {
  constructor(
    @Inject(PLANT_IDENTIFICATION_READ_REPOSITORY)
    private readonly plantIdentificationReadRepository: IPlantIdentificationReadRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<PlantIdentificationViewModel> {
    const identification =
      await this.plantIdentificationReadRepository.findById(id.value);
    if (!identification) {
      throw new PlantIdentificationNotFoundException(id.value);
    }
    return identification;
  }
}
