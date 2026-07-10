import { IPlantSpeciesPort } from '@contexts/plants/application/ports/plant-species.port';
import { PlantSpeciesBuilder } from '@contexts/plants/domain/builders/plant-species.builder';
import { PlantSpeciesViewModel } from '@contexts/plants/domain/view-models/plant-species.view-model';
import { FindOrCreatePlantSpeciesByGbifKeyCommand } from '@contexts/plant-species/application/commands/find-or-create-plant-species-by-gbif-key/find-or-create-plant-species-by-gbif-key.command';
import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { PlantSpeciesViewModel as PlantSpeciesCatalogViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@Injectable()
export class PlantSpeciesAdapter implements IPlantSpeciesPort {
  private readonly logger = new Logger(PlantSpeciesAdapter.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly plantSpeciesBuilder: PlantSpeciesBuilder,
  ) {}

  async findByPlantSpeciesId(
    plantSpeciesId: string,
  ): Promise<PlantSpeciesViewModel | null> {
    this.logger.log(`Fetching plant species data for id ${plantSpeciesId}`);

    const catalogViewModel = await this.queryBus
      .execute<
        PlantSpeciesFindByIdQuery,
        PlantSpeciesCatalogViewModel | null
      >(new PlantSpeciesFindByIdQuery({ plantSpeciesId }))
      .catch(() => null);

    if (!catalogViewModel) {
      this.logger.warn(`Plant species not found for id ${plantSpeciesId}`);
      return null;
    }

    this.logger.debug(`Plant species ${catalogViewModel.id} resolved`);

    return this.plantSpeciesBuilder
      .withId(catalogViewModel.id)
      .withScientificName(catalogViewModel.scientificName)
      .withGbifKey(catalogViewModel.gbifKey)
      .withCreatedAt(catalogViewModel.createdAt)
      .withUpdatedAt(catalogViewModel.updatedAt)
      .buildViewModel();
  }

  async findOrCreateByGbifKey(
    gbifKey: number,
    scientificName: string,
  ): Promise<{ id: string }> {
    this.logger.log(`Resolving plant species for gbifKey ${gbifKey}`);

    const id = await this.commandBus.execute<
      FindOrCreatePlantSpeciesByGbifKeyCommand,
      string
    >(
      new FindOrCreatePlantSpeciesByGbifKeyCommand({ gbifKey, scientificName }),
    );

    return { id };
  }
}
