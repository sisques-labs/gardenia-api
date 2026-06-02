import { Injectable } from '@nestjs/common';

import { IPlantingSpotInUsePort } from '@contexts/planting-spots/application/ports/planting-spot-in-use.port';

@Injectable()
export class PlantingSpotInUseStubAdapter implements IPlantingSpotInUsePort {
  async countByPlantingSpotId(_id: string): Promise<number> {
    return Promise.resolve(0);
  }
}
