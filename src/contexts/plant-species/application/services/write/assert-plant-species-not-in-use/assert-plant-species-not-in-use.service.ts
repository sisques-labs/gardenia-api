import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import {
  IPlantSpeciesReferencePort,
  PLANT_SPECIES_REFERENCE_PORT,
} from '@contexts/plant-species/application/ports/plant-species-reference.port';
import { PlantSpeciesInUseException } from '@contexts/plant-species/domain/exceptions/plant-species-in-use.exception';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';

@Injectable()
export class AssertPlantSpeciesNotInUseService implements IBaseService {
  constructor(
    @Inject(PLANT_SPECIES_REFERENCE_PORT)
    private readonly plantSpeciesReferencePort: IPlantSpeciesReferencePort,
  ) {}

  async execute(id: PlantSpeciesIdValueObject): Promise<void> {
    const count = await this.plantSpeciesReferencePort.countPlantsBySpeciesId(
      id.value,
    );

    if (count > 0) {
      throw new PlantSpeciesInUseException(id.value);
    }
  }
}
