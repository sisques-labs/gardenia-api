import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesNameAlreadyExistsException } from '@contexts/plant-species/domain/exceptions/plant-species-name-already-exists.exception';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-name/plant-species-name.value-object';

@Injectable()
export class AssertPlantSpeciesNameAvailableService implements IBaseService {
  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
  ) {}

  async execute(
    name: PlantSpeciesNameValueObject,
    excludeId?: string,
  ): Promise<void> {
    const normalized = name.value.toLowerCase();
    const existing =
      await this.plantSpeciesWriteRepository.findByNameNormalized(normalized);

    if (existing && existing.id.value !== excludeId) {
      throw new PlantSpeciesNameAlreadyExistsException(name.value);
    }
  }
}
