import { Inject, Injectable } from '@nestjs/common';
import { IBaseService, UuidValueObject } from '@sisques-labs/nestjs-kit';
import {
  IPlantingSpotInUsePort,
  PLANTING_SPOT_IN_USE_PORT,
} from '@contexts/planting-spots/application/ports/planting-spot-in-use.port';
import { PlantingSpotInUseException } from '@contexts/planting-spots/domain/exceptions/planting-spot-in-use.exception';

@Injectable()
export class AssertPlantingSpotNotInUseService implements IBaseService {
  constructor(
    @Inject(PLANTING_SPOT_IN_USE_PORT)
    private readonly plantingSpotInUsePort: IPlantingSpotInUsePort,
  ) {}

  async execute(id: UuidValueObject): Promise<void> {
    const count = await this.plantingSpotInUsePort.countByPlantingSpotId(
      id.value,
    );

    if (count > 0) {
      throw new PlantingSpotInUseException(id.value);
    }
  }
}
