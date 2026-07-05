import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  IPlantQrPort,
  PLANT_QR_PORT,
} from '@contexts/plants/application/ports/plant-qr.port';
import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
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
    @Inject(PLANT_QR_PORT)
    private readonly plantQrPort: IPlantQrPort,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeletePlantCommand): Promise<void> {
    const plant = await this.assertPlantExistsService.execute(command.plantId);

    plant.delete();

    if (plant.qrId) {
      await this.plantQrPort.delete(plant.qrId.value);
    }

    await this.plantWriteRepository.delete(plant.id.value);
    await this.publishEvents(plant);

    this.logger.log(
      `Plant deleted: ${command.plantId.value} by user: ${command.requestingUserId.value}`,
    );
  }
}
