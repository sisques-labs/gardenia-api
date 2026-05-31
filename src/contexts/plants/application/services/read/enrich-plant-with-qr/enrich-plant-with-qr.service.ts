import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import {
  IPlantQrPort,
  PLANT_QR_PORT,
} from '@contexts/plants/application/ports/plant-qr.port';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EnrichPlantWithQrService {
  private readonly logger = new Logger(EnrichPlantWithQrService.name);

  constructor(
    private readonly plantBuilder: PlantBuilder,
    @Inject(PLANT_QR_PORT) private readonly qrPort: IPlantQrPort,
  ) {}

  async execute(plant: PlantViewModel): Promise<PlantViewModel> {
    this.logger.log(`Enriching plant ${plant.id} with QR`);

    if (!plant.qrId) {
      this.logger.warn(`Plant ${plant.id} has no QR`);
      return plant;
    }

    const qrData = await this.qrPort.findByQrId(plant.qrId);

    if (!qrData) {
      this.logger.warn(`No QR data found for qrId ${plant.qrId}`);
      return plant;
    }

    this.logger.debug(`QR ${qrData.id} found for plant ${plant.id}`);

    return this.plantBuilder
      .withId(plant.id)
      .withName(plant.name)
      .withPlantSpeciesId(plant.plantSpeciesId)
      .withSpecies(plant.species)
      .withImageUrl(plant.imageUrl)
      .withUserId(plant.userId)
      .withSpaceId(plant.spaceId)
      .withQrId(plant.qrId)
      .withQr(qrData)
      .withCreatedAt(plant.createdAt)
      .withUpdatedAt(plant.updatedAt)
      .buildViewModel();
  }
}
