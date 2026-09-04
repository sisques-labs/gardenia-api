import { Inject, Injectable } from '@nestjs/common';
import { IBaseService, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesNotFoundException } from '@contexts/plant-species/domain/exceptions/plant-species-not-found.exception';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';

@Injectable()
export class AssertPlantSpeciesExistsService implements IBaseService {
  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<PlantSpeciesAggregate> {
    const plantSpecies = await this.plantSpeciesWriteRepository.findById(
      id.value,
    );
    if (!plantSpecies) throw new PlantSpeciesNotFoundException(id.value);

    return plantSpecies;
  }
}
