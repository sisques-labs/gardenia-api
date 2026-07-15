import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { IPlantsPort } from '@contexts/plant-photos/application/ports/plants.port';
import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';
import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

@Injectable()
export class PlantsAdapter implements IPlantsPort {
  private readonly logger = new Logger(PlantsAdapter.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async getImageUrl(plantId: string): Promise<string | null> {
    const plant = await this.queryBus
      .execute<PlantFindByIdQuery, PlantViewModel | null>(
        new PlantFindByIdQuery({ plantId }),
      )
      .catch(() => null);

    return plant?.imageUrl ?? null;
  }

  async updateImageUrl(
    plantId: string,
    imageUrl: string | null,
    requestingUserId: string,
  ): Promise<void> {
    this.logger.log(`Syncing imageUrl for plant ${plantId} via plants context`);

    await this.commandBus.execute(
      new UpdatePlantCommand({ plantId, imageUrl, requestingUserId }),
    );
  }
}
