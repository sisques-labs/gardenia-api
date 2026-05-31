import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { AssertPlantSpeciesExistsService } from '@contexts/plant-species/application/services/write/assert-plant-species-exists/assert-plant-species-exists.service';
import { AssertPlantSpeciesNotInUseService } from '@contexts/plant-species/application/services/write/assert-plant-species-not-in-use/assert-plant-species-not-in-use.service';

import { DeletePlantSpeciesCommand } from './delete-plant-species.command';

@CommandHandler(DeletePlantSpeciesCommand)
export class DeletePlantSpeciesCommandHandler
  extends BaseCommandHandler<DeletePlantSpeciesCommand, PlantSpeciesAggregate>
  implements ICommandHandler<DeletePlantSpeciesCommand, void>
{
  private readonly logger = new Logger(DeletePlantSpeciesCommandHandler.name);

  constructor(
    @Inject(PLANT_SPECIES_WRITE_REPOSITORY)
    private readonly plantSpeciesWriteRepository: IPlantSpeciesWriteRepository,
    private readonly assertPlantSpeciesExistsService: AssertPlantSpeciesExistsService,
    private readonly assertPlantSpeciesNotInUseService: AssertPlantSpeciesNotInUseService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeletePlantSpeciesCommand): Promise<void> {
    const plantSpecies = await this.assertPlantSpeciesExistsService.execute(
      command.id,
    );

    await this.assertPlantSpeciesNotInUseService.execute(command.id);

    plantSpecies.delete();

    await this.plantSpeciesWriteRepository.delete(plantSpecies.id.value);
    await this.publishEvents(plantSpecies);

    this.logger.log(`Plant species deleted: ${command.id.value}`);
  }
}
