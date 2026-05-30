import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { NotPlantOwnerException } from '@contexts/plants/domain/exceptions/not-plant-owner.exception';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { AssertPlantExistsService } from '../../services/write/assert-plant-exists/assert-plant-exists.service';

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
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdatePlantCommand): Promise<void> {
    const plant = await this.assertPlantExistsService.execute(command.plantId);

    if (plant.userId.value !== command.requestingUserId.value) {
      throw new NotPlantOwnerException(
        command.requestingUserId.value,
        command.plantId.value,
      );
    }

    plant.update({
      name: command.name,
      species: command.species,
      imageUrl: command.imageUrl,
    });

    await this.plantWriteRepository.save(plant);
    await this.publishEvents(plant);

    this.logger.log(
      `Plant updated: ${command.plantId.value} by user: ${command.requestingUserId.value}`,
    );
  }
}
