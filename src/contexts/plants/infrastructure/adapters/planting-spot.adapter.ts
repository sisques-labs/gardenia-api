import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { IPlantingSpotPort } from '@contexts/plants/application/ports/planting-spot.port';
import { PlantPlantingSpotBuilder } from '@contexts/plants/domain/builders/plant-planting-spot.builder';
import { PlantPlantingSpotViewModel } from '@contexts/plants/domain/view-models/plant-planting-spot.view-model';
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

@Injectable()
export class PlantingSpotAdapter implements IPlantingSpotPort {
  private readonly logger = new Logger(PlantingSpotAdapter.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantPlantingSpotBuilder: PlantPlantingSpotBuilder,
  ) {}

  async findById(id: string): Promise<PlantPlantingSpotViewModel | null> {
    this.logger.log(`Fetching planting spot data for id ${id}`);

    const vm = await this.queryBus
      .execute<
        PlantingSpotFindByIdQuery,
        PlantingSpotViewModel | null
      >(new PlantingSpotFindByIdQuery({ id }))
      .catch(() => null);

    if (!vm) {
      this.logger.warn(`Planting spot not found for id ${id}`);
      return null;
    }

    this.logger.debug(`Planting spot ${vm.id} resolved`);

    return this.plantPlantingSpotBuilder
      .withId(vm.id)
      .withName(vm.name)
      .withType(vm.type)
      .withDescription(vm.description)
      .withUserId(vm.userId)
      .withSpaceId(vm.spaceId)
      .withCreatedAt(vm.createdAt)
      .withUpdatedAt(vm.updatedAt)
      .buildViewModel();
  }
}
