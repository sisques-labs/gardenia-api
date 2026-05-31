import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesNotFoundException } from '@contexts/plant-species/domain/exceptions/plant-species-not-found.exception';
import {
  IPlantSpeciesReadRepository,
  PLANT_SPECIES_READ_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/read/plant-species-read.repository';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

@Injectable()
export class AssertPlantSpeciesViewModelExistsService implements IBaseService {
  constructor(
    @Inject(PLANT_SPECIES_READ_REPOSITORY)
    private readonly plantSpeciesReadRepository: IPlantSpeciesReadRepository,
  ) {}

  async execute(id: PlantSpeciesIdValueObject): Promise<PlantSpeciesViewModel> {
    const plantSpecies = await this.plantSpeciesReadRepository.findById(
      id.value,
    );
    if (!plantSpecies) throw new PlantSpeciesNotFoundException(id.value);

    return plantSpecies;
  }
}
