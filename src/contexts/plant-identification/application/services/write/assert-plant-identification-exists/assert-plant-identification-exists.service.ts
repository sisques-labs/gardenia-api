import { Inject, Injectable } from '@nestjs/common';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationNotFoundException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-found.exception';
import {
  IPlantIdentificationWriteRepository,
  PLANT_IDENTIFICATION_WRITE_REPOSITORY,
} from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';

@Injectable()
export class AssertPlantIdentificationExistsService {
  constructor(
    @Inject(PLANT_IDENTIFICATION_WRITE_REPOSITORY)
    private readonly plantIdentificationWriteRepository: IPlantIdentificationWriteRepository,
  ) {}

  async execute(
    id: PlantIdentificationIdValueObject,
  ): Promise<PlantIdentificationAggregate> {
    const identification =
      await this.plantIdentificationWriteRepository.findById(id.value);
    if (!identification) {
      throw new PlantIdentificationNotFoundException(id.value);
    }
    return identification;
  }
}
