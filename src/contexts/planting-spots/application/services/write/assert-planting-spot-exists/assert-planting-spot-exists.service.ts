import { Inject, Injectable } from '@nestjs/common';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import {
  IPlantingSpotWriteRepository,
  PLANTING_SPOT_WRITE_REPOSITORY,
} from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

@Injectable()
export class AssertPlantingSpotExistsService {
  constructor(
    @Inject(PLANTING_SPOT_WRITE_REPOSITORY)
    private readonly plantingSpotWriteRepository: IPlantingSpotWriteRepository,
  ) {}

  async execute(
    id: PlantingSpotIdValueObject,
    spaceId: string,
  ): Promise<PlantingSpotAggregate> {
    const spot = await this.plantingSpotWriteRepository.findById(
      id.value,
      spaceId,
    );
    if (!spot) throw new PlantingSpotNotFoundException(id.value);

    return spot;
  }
}
