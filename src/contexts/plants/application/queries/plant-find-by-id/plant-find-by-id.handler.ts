import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { AssertPlantViewModelExistsService } from '@contexts/plants/application/services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';
import { EnrichPlantWithQrService } from '@contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service';
import { EnrichPlantWithSpeciesService } from '@contexts/plants/application/services/read/enrich-plant-with-species/enrich-plant-with-species.service';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(PlantFindByIdQuery)
export class PlantFindByIdQueryHandler implements IQueryHandler<
  PlantFindByIdQuery,
  PlantViewModel
> {
  private readonly logger = new Logger(PlantFindByIdQueryHandler.name);

  constructor(
    private readonly assertPlantViewModelExistsService: AssertPlantViewModelExistsService,
    private readonly enrichPlantWithSpeciesService: EnrichPlantWithSpeciesService,
    private readonly enrichPlantWithQrService: EnrichPlantWithQrService,
  ) {}

  async execute(query: PlantFindByIdQuery): Promise<PlantViewModel> {
    this.logger.log(
      `Executing PlantFindByIdQuery for plant ${query.plantId.value}`,
    );

    const plant = await this.assertPlantViewModelExistsService.execute(
      query.plantId,
    );

    const withSpecies = await this.enrichPlantWithSpeciesService.execute(plant);

    return this.enrichPlantWithQrService.execute(withSpecies);
  }
}
