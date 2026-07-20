import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CreatedPlantPortResult } from '@contexts/plant-identification/application/ports/created-plant-port.result';
import { CreatePlantPortInput } from '@contexts/plant-identification/application/ports/create-plant-port.input';
import { IPlantsPort } from '@contexts/plant-identification/application/ports/plants.port';
import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';

@Injectable()
export class PlantsAdapter implements IPlantsPort {
  private readonly logger = new Logger(PlantsAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async createPlant(
    input: CreatePlantPortInput,
  ): Promise<CreatedPlantPortResult> {
    this.logger.log(
      `Creating plant '${input.name}' from identification via plants context`,
    );

    const plantId = await this.commandBus.execute<CreatePlantCommand, string>(
      new CreatePlantCommand({
        name: input.name,
        gbifSpeciesKey: input.gbifSpeciesKey ?? null,
        speciesScientificName: input.speciesScientificName ?? null,
        imageUrl: input.imageUrl ?? null,
        userId: input.userId,
      }),
    );

    return { id: plantId };
  }
}
