import { Inject, Injectable, Logger } from '@nestjs/common';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  IPlantingSpotPort,
  PLANTING_SPOT_PORT,
} from '@contexts/plants/application/ports/planting-spot.port';
import { PlantPlantingSpotNotFoundException } from '@contexts/plants/domain/exceptions/plant-planting-spot-not-found.exception';

@Injectable()
export class AssertPlantPlantingSpotExistsService {
  private readonly logger = new Logger(
    AssertPlantPlantingSpotExistsService.name,
  );

  constructor(
    @Inject(PLANTING_SPOT_PORT)
    private readonly plantingSpotPort: IPlantingSpotPort,
  ) {}

  async execute(
    plantingSpotId: UuidValueObject,
    spaceId: string,
  ): Promise<void> {
    this.logger.log(`Asserting planting spot exists: ${plantingSpotId.value}`);

    const spot = await this.plantingSpotPort.findById(
      plantingSpotId.value,
      spaceId,
    );

    if (!spot) {
      throw new PlantPlantingSpotNotFoundException(plantingSpotId.value);
    }
  }
}
