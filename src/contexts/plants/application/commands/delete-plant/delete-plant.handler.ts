import { Inject, Logger } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { DeleteQrCommand } from '@contexts/qr/application/commands/delete-qr/delete-qr.command';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { NotPlantOwnerException } from '@contexts/plants/domain/exceptions/not-plant-owner.exception';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { AssertPlantExistsService } from '../../services/write/assert-plant-exists/assert-plant-exists.service';

import { DeletePlantCommand } from './delete-plant.command';

@CommandHandler(DeletePlantCommand)
export class DeletePlantCommandHandler
  extends BaseCommandHandler<DeletePlantCommand, PlantAggregate>
  implements ICommandHandler<DeletePlantCommand, void>
{
  private readonly logger = new Logger(DeletePlantCommandHandler.name);

  constructor(
    @Inject(PLANT_WRITE_REPOSITORY)
    private readonly plantWriteRepository: IPlantWriteRepository,
    private readonly assertPlantExistsService: AssertPlantExistsService,
    private readonly commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeletePlantCommand): Promise<void> {
    const plant = await this.assertPlantExistsService.execute(command.plantId);

    if (plant.userId.value !== command.requestingUserId.value) {
      throw new NotPlantOwnerException(
        command.requestingUserId.value,
        command.plantId.value,
      );
    }

    plant.delete();

    if (plant.qrId) {
      await this.commandBus.execute(
        new DeleteQrCommand({ qrId: plant.qrId.value }),
      );
    }

    await this.plantWriteRepository.delete(plant.id.value);
    await this.publishEvents(plant);

    this.logger.log(
      `Plant deleted: ${command.plantId.value} by user: ${command.requestingUserId.value}`,
    );
  }
}
