import { Inject, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { UpdatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/update-plant-species/update-plant-species.command';
import {
  IPlantSpeciesImportPort,
  PLANT_SPECIES_IMPORT_PORT,
} from '@contexts/plant-species/application/ports/plant-species-import.port';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';

import { EnrichPlantSpeciesCommand } from './enrich-plant-species.command';

@CommandHandler(EnrichPlantSpeciesCommand)
export class EnrichPlantSpeciesCommandHandler implements ICommandHandler<
  EnrichPlantSpeciesCommand,
  string | null
> {
  private readonly logger = new Logger(EnrichPlantSpeciesCommandHandler.name);

  constructor(
    @Inject(PLANT_SPECIES_IMPORT_PORT)
    private readonly importPort: IPlantSpeciesImportPort,
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: EnrichPlantSpeciesCommand): Promise<string | null> {
    const enrichment = await this.importPort.fetchByScientificName(
      command.scientificName.value,
    );

    if (!enrichment) {
      this.logger.log(
        `No enrichment data for scientific name: ${command.scientificName.value}`,
      );
      return null;
    }

    const existing =
      await this.plantSpeciesWriteRepository.findByScientificName(
        enrichment.scientificName.toLowerCase(),
      );

    if (existing) {
      await this.commandBus.execute(
        new UpdatePlantSpeciesCommand({
          id: existing.id.value,
          description: enrichment.description ?? undefined,
          imageUrl: enrichment.imageUrl ?? undefined,
        }),
      );

      this.logger.log(`Plant species enriched: ${existing.id.value}`);
      return existing.id.value;
    }

    const id = await this.commandBus.execute<CreatePlantSpeciesCommand, string>(
      new CreatePlantSpeciesCommand({
        scientificName: enrichment.scientificName,
      }),
    );

    await this.commandBus.execute(
      new UpdatePlantSpeciesCommand({
        id,
        description: enrichment.description ?? undefined,
        imageUrl: enrichment.imageUrl ?? undefined,
      }),
    );

    this.logger.log(`Plant species created from enrichment: ${id}`);
    return id;
  }
}
