import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesGbifKeyAlreadyExistsException } from '@contexts/plant-species/domain/exceptions/plant-species-gbif-key-already-exists.exception';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';

@Injectable()
export class AssertPlantSpeciesGbifKeyAvailableService implements IBaseService {
  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
  ) {}

  async execute(
    gbifKey: PlantSpeciesGbifKeyValueObject,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.plantSpeciesWriteRepository.findByGbifKey(
      gbifKey.value,
    );

    if (existing && existing.id.value !== excludeId) {
      throw new PlantSpeciesGbifKeyAlreadyExistsException(gbifKey.value);
    }
  }
}
