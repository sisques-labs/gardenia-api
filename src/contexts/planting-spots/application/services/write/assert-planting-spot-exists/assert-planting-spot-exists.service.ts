import { Inject, Injectable } from '@nestjs/common';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';
import {
  IPlantingSpotWriteRepository,
  PLANTING_SPOT_WRITE_REPOSITORY,
} from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';

@Injectable()
export class AssertPlantingSpotExistsService {
  constructor(
    @Inject(PLANTING_SPOT_WRITE_REPOSITORY)
    private readonly plantingSpotWriteRepository: IPlantingSpotWriteRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<PlantingSpotAggregate> {
    const spot = await this.plantingSpotWriteRepository.findById(id.value);
    if (!spot) throw new PlantingSpotNotFoundException(id.value);

    return spot;
  }
}
