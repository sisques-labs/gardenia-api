import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  IPlantSpeciesPort,
  PLANT_SPECIES_PORT,
} from '@contexts/plants/application/ports/plant-species.port';
import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantLinkedSpeciesIdValueObject } from '@contexts/plants/domain/value-objects/plant-linked-species-id/plant-linked-species-id.value-object';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { AssertPlantExistsService } from '../../services/write/assert-plant-exists/assert-plant-exists.service';
import { AssertPlantPlantingSpotExistsService } from '../../services/write/assert-plant-planting-spot-exists/assert-plant-planting-spot-exists.service';

import { UpdatePlantCommand } from './update-plant.command';

@CommandHandler(UpdatePlantCommand)
export class UpdatePlantCommandHandler
  extends BaseCommandHandler<UpdatePlantCommand, PlantAggregate>
  implements ICommandHandler<UpdatePlantCommand, void>
{
  private readonly logger = new Logger(UpdatePlantCommandHandler.name);

  constructor(
    @Inject(PLANT_WRITE_REPOSITORY)
    private readonly plantWriteRepository: IPlantWriteRepository,
    private readonly assertPlantExistsService: AssertPlantExistsService,
    @Inject(PLANT_SPECIES_PORT)
    private readonly plantSpeciesPort: IPlantSpeciesPort,
    private readonly assertPlantPlantingSpotExistsService: AssertPlantPlantingSpotExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdatePlantCommand): Promise<void> {
    const plant = await this.assertPlantExistsService.execute(command.plantId);

    let plantSpeciesId: PlantLinkedSpeciesIdValueObject | null | undefined =
      undefined;
    if (command.gbifSpeciesKey !== undefined) {
      if (command.gbifSpeciesKey === null) {
        plantSpeciesId = null;
      } else {
        const linked = await this.plantSpeciesPort.findOrCreateByGbifKey(
          command.gbifSpeciesKey.value,
          command.speciesScientificName!.value,
        );
        plantSpeciesId = new PlantLinkedSpeciesIdValueObject(linked.id);
      }
    }

    if (command.plantingSpotId) {
      await this.assertPlantPlantingSpotExistsService.execute(
        command.plantingSpotId,
        plant.spaceId.value,
      );
    }

    plant.update({
      name: command.name,
      plantSpeciesId,
      imageUrl: command.imageUrl,
      plantingSpotId: command.plantingSpotId,
    });

    await this.plantWriteRepository.save(plant);
    await this.publishEvents(plant);

    this.logger.log(
      `Plant updated: ${command.plantId.value} by user: ${command.requestingUserId.value}`,
    );
  }
}
