import {
  IPlantSpeciesPort,
  PLANT_SPECIES_PORT,
} from '@contexts/plants/application/ports/plant-species.port';
import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EnrichPlantWithSpeciesService {
  private readonly logger = new Logger(EnrichPlantWithSpeciesService.name);

  constructor(
    private readonly plantBuilder: PlantBuilder,
    @Inject(PLANT_SPECIES_PORT) private readonly speciesPort: IPlantSpeciesPort,
  ) {}

  async execute(plant: PlantViewModel): Promise<PlantViewModel> {
    this.logger.log(`Enriching plant ${plant.id} with species`);

    if (!plant.plantSpeciesId) {
      this.logger.warn(`Plant ${plant.id} has no linked species`);
      return plant;
    }

    const speciesData = await this.speciesPort.findByPlantSpeciesId(
      plant.plantSpeciesId,
    );

    if (!speciesData) {
      this.logger.warn(
        `No species data found for plantSpeciesId ${plant.plantSpeciesId}`,
      );
      return plant;
    }

    this.logger.debug(`Species ${speciesData.id} found for plant ${plant.id}`);

    return this.plantBuilder
      .withId(plant.id)
      .withName(plant.name)
      .withPlantSpeciesId(plant.plantSpeciesId)
      .withSpecies(speciesData)
      .withImageUrl(plant.imageUrl)
      .withUserId(plant.userId)
      .withSpaceId(plant.spaceId)
      .withQrId(plant.qrId)
      .withQr(plant.qr)
      .withCreatedAt(plant.createdAt)
      .withUpdatedAt(plant.updatedAt)
      .buildViewModel();
  }
}
