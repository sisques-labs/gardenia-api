import { Inject, Injectable } from '@nestjs/common';

import { PlantIdentificationNotFoundException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-found.exception';
import {
  IPlantIdentificationReadRepository,
  PLANT_IDENTIFICATION_READ_REPOSITORY,
} from '@contexts/plant-identification/domain/repositories/read/plant-identification-read.repository';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';

@Injectable()
export class AssertPlantIdentificationViewModelExistsService {
  constructor(
    @Inject(PLANT_IDENTIFICATION_READ_REPOSITORY)
    private readonly plantIdentificationReadRepository: IPlantIdentificationReadRepository,
  ) {}

  async execute(
    id: PlantIdentificationIdValueObject,
  ): Promise<PlantIdentificationViewModel> {
    const identification =
      await this.plantIdentificationReadRepository.findById(id.value);
    if (!identification) {
      throw new PlantIdentificationNotFoundException(id.value);
    }
    return identification;
  }
}
