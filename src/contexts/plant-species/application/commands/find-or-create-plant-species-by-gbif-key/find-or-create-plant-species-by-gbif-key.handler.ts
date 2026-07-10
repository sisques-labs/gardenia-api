import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';

import { FindOrCreatePlantSpeciesByGbifKeyCommand } from './find-or-create-plant-species-by-gbif-key.command';

@CommandHandler(FindOrCreatePlantSpeciesByGbifKeyCommand)
export class FindOrCreatePlantSpeciesByGbifKeyCommandHandler
  extends BaseCommandHandler<
    FindOrCreatePlantSpeciesByGbifKeyCommand,
    PlantSpeciesAggregate
  >
  implements ICommandHandler<FindOrCreatePlantSpeciesByGbifKeyCommand, string>
{
  private readonly logger = new Logger(
    FindOrCreatePlantSpeciesByGbifKeyCommandHandler.name,
  );

  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
    private readonly plantSpeciesBuilder: PlantSpeciesBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: FindOrCreatePlantSpeciesByGbifKeyCommand,
  ): Promise<string> {
    const existing = await this.plantSpeciesWriteRepository.findByGbifKey(
      command.gbifKey.value,
    );

    if (existing) {
      this.logger.log(
        `Reusing existing plant species for gbifKey ${command.gbifKey.value}: ${existing.id.value}`,
      );
      return existing.id.value;
    }

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

    this.logger.log(
      `Plant species created from gbifKey ${command.gbifKey.value}: ${plantSpecies.id.value}`,
    );

    return plantSpecies.id.value;
  }
}
