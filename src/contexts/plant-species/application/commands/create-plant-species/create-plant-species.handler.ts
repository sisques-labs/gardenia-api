import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { AssertPlantSpeciesGbifKeyAvailableService } from '@contexts/plant-species/application/services/write/assert-plant-species-gbif-key-available/assert-plant-species-gbif-key-available.service';

import { CreatePlantSpeciesCommand } from './create-plant-species.command';

@CommandHandler(CreatePlantSpeciesCommand)
export class CreatePlantSpeciesCommandHandler
  extends BaseCommandHandler<CreatePlantSpeciesCommand, PlantSpeciesAggregate>
  implements ICommandHandler<CreatePlantSpeciesCommand, string>
{
  private readonly logger = new Logger(CreatePlantSpeciesCommandHandler.name);

  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
    private readonly assertPlantSpeciesGbifKeyAvailableService: AssertPlantSpeciesGbifKeyAvailableService,
    private readonly plantSpeciesBuilder: PlantSpeciesBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreatePlantSpeciesCommand): Promise<string> {
    await this.assertPlantSpeciesGbifKeyAvailableService.execute(
      command.gbifKey,
    );

    const now = new Date();
    const plantSpecies = this.plantSpeciesBuilder
      .withId(UuidValueObject.generate().value)
      .withScientificName(command.scientificName.value)
      .withGbifKey(command.gbifKey.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    plantSpecies.create();

    await this.plantSpeciesWriteRepository.save(plantSpecies);
    await this.publishEvents(plantSpecies);

    this.logger.log(`Plant species created: ${plantSpecies.id.value}`);

    return plantSpecies.id.value;
  }
}
