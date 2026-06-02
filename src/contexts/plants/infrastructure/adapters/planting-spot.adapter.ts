import { IPlantingSpotPort } from '@contexts/plants/application/ports/planting-spot.port';
import { PlantPlantingSpotViewModel } from '@contexts/plants/domain/view-models/plant-planting-spot.view-model';
import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

@Injectable()
export class PlantingSpotAdapter implements IPlantingSpotPort {
  private readonly logger = new Logger(PlantingSpotAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async findById(
    id: string,
    spaceId: string,
  ): Promise<PlantPlantingSpotViewModel | null> {
    this.logger.log(`Fetching planting spot data for id ${id}`);

    const vm = await this.queryBus
      .execute<
        PlantingSpotFindByIdQuery,
        PlantingSpotViewModel | null
      >(new PlantingSpotFindByIdQuery({ spotId: id, spaceId }))
      .catch(() => null);

    if (!vm) {
      this.logger.warn(`Planting spot not found for id ${id}`);
      return null;
    }

    this.logger.debug(`Planting spot ${vm.id} resolved`);

    return new PlantPlantingSpotViewModel({
      id: vm.id,
      name: vm.name,
      type: vm.type,
      description: vm.description,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    });
  }
}
