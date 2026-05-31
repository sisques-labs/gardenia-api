import {
  IPlantSpeciesPort,
  PLANT_SPECIES_PORT,
} from '@contexts/plants/application/ports/plant-species.port';
import { PlantLinkedSpeciesNotFoundException } from '@contexts/plants/domain/exceptions/plant-linked-species-not-found.exception';
import { PlantLinkedSpeciesIdValueObject } from '@contexts/plants/domain/value-objects/plant-linked-species-id/plant-linked-species-id.value-object';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AssertPlantLinkedSpeciesExistsService {
  private readonly logger = new Logger(
    AssertPlantLinkedSpeciesExistsService.name,
  );

  constructor(
    @Inject(PLANT_SPECIES_PORT) private readonly speciesPort: IPlantSpeciesPort,
  ) {}

  async execute(
    plantSpeciesId: PlantLinkedSpeciesIdValueObject,
  ): Promise<void> {
    this.logger.log(`Asserting plant species exists: ${plantSpeciesId.value}`);

    const species = await this.speciesPort.findByPlantSpeciesId(
      plantSpeciesId.value,
    );

    if (!species) {
      throw new PlantLinkedSpeciesNotFoundException(plantSpeciesId.value);
    }
  }
}
