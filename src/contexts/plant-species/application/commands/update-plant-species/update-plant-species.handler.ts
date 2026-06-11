import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { AssertPlantSpeciesExistsService } from '@contexts/plant-species/application/services/write/assert-plant-species-exists/assert-plant-species-exists.service';
import { AssertPlantSpeciesNameAvailableService } from '@contexts/plant-species/application/services/write/assert-plant-species-name-available/assert-plant-species-name-available.service';

import { UpdatePlantSpeciesCommand } from './update-plant-species.command';

@CommandHandler(UpdatePlantSpeciesCommand)
export class UpdatePlantSpeciesCommandHandler
  extends BaseCommandHandler<UpdatePlantSpeciesCommand, PlantSpeciesAggregate>
  implements ICommandHandler<UpdatePlantSpeciesCommand, void>
{
  private readonly logger = new Logger(UpdatePlantSpeciesCommandHandler.name);

  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
    private readonly assertPlantSpeciesExistsService: AssertPlantSpeciesExistsService,
    private readonly assertPlantSpeciesNameAvailableService: AssertPlantSpeciesNameAvailableService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdatePlantSpeciesCommand): Promise<void> {
    const plantSpecies = await this.assertPlantSpeciesExistsService.execute(
      command.id,
    );

    if (command.scientificName) {
      await this.assertPlantSpeciesNameAvailableService.execute(
        command.scientificName,
        command.id.value,
      );
    }

    plantSpecies.update({
      scientificName: command.scientificName,
      description: command.description,
      imageUrl: command.imageUrl,
    });

    await this.plantSpeciesWriteRepository.save(plantSpecies);
    await this.publishEvents(plantSpecies);

    this.logger.log(`Plant species updated: ${command.id.value}`);
  }
}
