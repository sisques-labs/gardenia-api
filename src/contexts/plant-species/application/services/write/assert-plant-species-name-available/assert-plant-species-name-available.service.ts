import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesNameAlreadyExistsException } from '@contexts/plant-species/domain/exceptions/plant-species-name-already-exists.exception';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

@Injectable()
export class AssertPlantSpeciesNameAvailableService implements IBaseService {
  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
  ) {}

  async execute(
    scientificName: PlantSpeciesScientificNameValueObject,
    excludeId?: string,
  ): Promise<void> {
    const normalized = scientificName.value.toLowerCase();
    const existing =
      await this.plantSpeciesWriteRepository.findByScientificName(normalized);

    if (existing && existing.id.value !== excludeId) {
      throw new PlantSpeciesNameAlreadyExistsException(scientificName.value);
    }
  }
}
