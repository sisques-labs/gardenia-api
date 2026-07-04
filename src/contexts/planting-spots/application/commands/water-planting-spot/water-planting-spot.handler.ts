import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IPlantingSpotPlantsPort,
  PLANTING_SPOT_PLANTS_PORT,
} from '@contexts/planting-spots/application/ports/planting-spot-plants.port';
import {
  IWaterPlantPort,
  WATER_PLANT_PORT,
} from '@contexts/planting-spots/application/ports/water-plant.port';
import { AssertPlantingSpotExistsService } from '@contexts/planting-spots/application/services/write/assert-planting-spot-exists/assert-planting-spot-exists.service';

import { WaterPlantingSpotCommand } from './water-planting-spot.command';
import {
  WaterPlantingSpotFailure,
  WaterPlantingSpotResult,
} from './water-planting-spot.result';

@CommandHandler(WaterPlantingSpotCommand)
export class WaterPlantingSpotCommandHandler implements ICommandHandler<
  WaterPlantingSpotCommand,
  WaterPlantingSpotResult
> {
  private readonly logger = new Logger(WaterPlantingSpotCommandHandler.name);

  constructor(
    @Inject(PLANTING_SPOT_PLANTS_PORT)
    private readonly plantingSpotPlantsPort: IPlantingSpotPlantsPort,
    @Inject(WATER_PLANT_PORT)
    private readonly waterPlantPort: IWaterPlantPort,
    private readonly assertPlantingSpotExistsService: AssertPlantingSpotExistsService,
  ) {}

  async execute(
    command: WaterPlantingSpotCommand,
  ): Promise<WaterPlantingSpotResult> {
    await this.assertPlantingSpotExistsService.execute(command.id);

    const plants = await this.plantingSpotPlantsPort.findByPlantingSpotId(
      command.id.value,
    );

    const settled = await Promise.allSettled(
      plants.map((plant) =>
        this.waterPlantPort.waterPlant({
          plantId: plant.id,
          userId: command.userId.value,
          spaceId: command.spaceId.value,
          performedAt: command.performedAt?.value,
        }),
      ),
    );

    const wateredPlantIds: string[] = [];
    const failedPlants: WaterPlantingSpotFailure[] = [];

    settled.forEach((result, index) => {
      const plantId = plants[index].id;
      if (result.status === 'fulfilled') {
        wateredPlantIds.push(plantId);
      } else {
        failedPlants.push({
          plantId,
          reason:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
        });
      }
    });

    this.logger.log(
      `Watered planting spot ${command.id.value}: ${wateredPlantIds.length} succeeded, ${failedPlants.length} failed`,
    );

    return {
      plantingSpotId: command.id.value,
      wateredPlantIds,
      failedPlants,
    };
  }
}
