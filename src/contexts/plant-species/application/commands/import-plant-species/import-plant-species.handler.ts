import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  IPlantSpeciesImportPort,
  PLANT_SPECIES_IMPORT_PORT,
} from '@contexts/plant-species/application/ports/plant-species-import.port';
import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesDescriptionValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-description/plant-species-description.value-object';
import { PlantSpeciesImageUrlValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-image-url/plant-species-image-url.value-object';

import { ImportPlantSpeciesCommand } from './import-plant-species.command';

export type ImportPlantSpeciesResult = {
  imported: number;
  skipped: number;
  errors: number;
};

@CommandHandler(ImportPlantSpeciesCommand)
export class ImportPlantSpeciesCommandHandler
  extends BaseCommandHandler<ImportPlantSpeciesCommand, PlantSpeciesAggregate>
  implements
    ICommandHandler<ImportPlantSpeciesCommand, ImportPlantSpeciesResult>
{
  private readonly logger = new Logger(ImportPlantSpeciesCommandHandler.name);

  constructor(
    @Inject(PLANT_SPECIES_IMPORT_PORT)
    private readonly importPort: IPlantSpeciesImportPort,
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
    private readonly plantSpeciesBuilder: PlantSpeciesBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: ImportPlantSpeciesCommand,
  ): Promise<ImportPlantSpeciesResult> {
    this.logger.log(
      `Importing plant species with limit=${command.limit.value} and offset=${command.offset.value}`,
    );

    const records = await this.importPort.fetchPage(
      command.limit.value,
      command.offset.value,
    );

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        const scientificName = record.scientificName.trim();
        if (!scientificName) {
          skipped++;
          continue;
        }

        const description =
          record.description != null
            ? new PlantSpeciesDescriptionValueObject(record.description)
            : null;
        const imageUrl =
          record.imageUrl != null
            ? new PlantSpeciesImageUrlValueObject(record.imageUrl)
            : null;

        const normalizedScientificName = scientificName.toLowerCase();
        const existing =
          await this.plantSpeciesWriteRepository.findByScientificName(
            normalizedScientificName,
          );

        if (existing) {
          if (description == null && imageUrl == null) {
            skipped++;
            continue;
          }

          existing.update({
            ...(description != null ? { description } : {}),
            ...(imageUrl != null ? { imageUrl } : {}),
          });
          await this.plantSpeciesWriteRepository.save(existing);
          await this.publishEvents(existing);
          imported++;
          continue;
        }

        const now = new Date();
        const aggregate = this.plantSpeciesBuilder
          .withId(UuidValueObject.generate().value)
          .withScientificName(scientificName)
          .withDescription(description?.value ?? null)
          .withImageUrl(imageUrl?.value ?? null)
          .withCreatedAt(now)
          .withUpdatedAt(now)
          .build();
        aggregate.create();

        await this.plantSpeciesWriteRepository.save(aggregate);
        await this.publishEvents(aggregate);
        imported++;
      } catch (error) {
        this.logger.warn(
          `Failed to import species ${record.scientificName}: ${error}`,
        );
        errors++;
      }
    }

    this.logger.log(
      `Plant species import completed: imported=${imported}, skipped=${skipped}, errors=${errors}`,
    );

    return { imported, skipped, errors };
  }
}
