import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotForbiddenException } from '@contexts/planting-spots/domain/exceptions/planting-spot-forbidden.exception';
import {
  IPlantingSpotWriteRepository,
  PLANTING_SPOT_WRITE_REPOSITORY,
} from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { AssertPlantingSpotExistsService } from '../../services/write/assert-planting-spot-exists/assert-planting-spot-exists.service';
import { AssertPlantingSpotNotInUseService } from '../../services/write/assert-planting-spot-not-in-use/assert-planting-spot-not-in-use.service';

import { DeletePlantingSpotCommand } from './delete-planting-spot.command';

@CommandHandler(DeletePlantingSpotCommand)
export class DeletePlantingSpotCommandHandler
  extends BaseCommandHandler<DeletePlantingSpotCommand, PlantingSpotAggregate>
  implements ICommandHandler<DeletePlantingSpotCommand, void>
{
  private readonly logger = new Logger(DeletePlantingSpotCommandHandler.name);

  constructor(
    @Inject(PLANTING_SPOT_WRITE_REPOSITORY)
    private readonly plantingSpotWriteRepository: IPlantingSpotWriteRepository,
    private readonly assertPlantingSpotExistsService: AssertPlantingSpotExistsService,
    private readonly assertPlantingSpotNotInUseService: AssertPlantingSpotNotInUseService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeletePlantingSpotCommand): Promise<void> {
    const spot = await this.assertPlantingSpotExistsService.execute(
      command.spotId,
    );

    if (spot.userId.value !== command.requestingUserId.value) {
      throw new PlantingSpotForbiddenException(
        command.requestingUserId.value,
        command.spotId.value,
      );
    }

    await this.assertPlantingSpotNotInUseService.execute(command.spotId);

    spot.delete();

    await this.plantingSpotWriteRepository.delete(spot.id.value);
    await this.publishEvents(spot);

    this.logger.log(
      `PlantingSpot deleted: ${command.spotId.value} by user: ${command.requestingUserId.value}`,
    );
  }
}
