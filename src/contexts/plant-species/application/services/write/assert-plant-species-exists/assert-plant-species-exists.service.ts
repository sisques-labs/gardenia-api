import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesNotFoundException } from '@contexts/plant-species/domain/exceptions/plant-species-not-found.exception';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';

@Injectable()
export class AssertPlantSpeciesExistsService implements IBaseService {
  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
  ) {}

  async execute(id: PlantSpeciesIdValueObject): Promise<PlantSpeciesAggregate> {
    const plantSpecies = await this.plantSpeciesWriteRepository.findById(
      id.value,
    );
    if (!plantSpecies) throw new PlantSpeciesNotFoundException(id.value);

    return plantSpecies;
  }
}
