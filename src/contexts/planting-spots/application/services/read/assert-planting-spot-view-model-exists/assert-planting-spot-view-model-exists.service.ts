import { Inject, Injectable } from '@nestjs/common';

import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import {
  IPlantingSpotReadRepository,
  PLANTING_SPOT_READ_REPOSITORY,
} from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';

import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertPlantingSpotViewModelExistsService {
  constructor(
    @Inject(PLANTING_SPOT_READ_REPOSITORY)
    private readonly plantingSpotReadRepository: IPlantingSpotReadRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<PlantingSpotViewModel> {
    const spot = await this.plantingSpotReadRepository.findById(id.value);
    if (!spot) throw new PlantingSpotNotFoundException(id.value);

    return spot;
  }
}
