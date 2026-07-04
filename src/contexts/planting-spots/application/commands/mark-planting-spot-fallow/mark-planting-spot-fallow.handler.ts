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

import { MarkPlantingSpotFallowCommand } from './mark-planting-spot-fallow.command';

@CommandHandler(MarkPlantingSpotFallowCommand)
export class MarkPlantingSpotFallowCommandHandler
  extends BaseCommandHandler<
    MarkPlantingSpotFallowCommand,
    PlantingSpotAggregate
  >
  implements ICommandHandler<MarkPlantingSpotFallowCommand, void>
{
  private readonly logger = new Logger(
    MarkPlantingSpotFallowCommandHandler.name,
  );

  constructor(
    @Inject(PLANTING_SPOT_WRITE_REPOSITORY)
    private readonly plantingSpotWriteRepository: IPlantingSpotWriteRepository,
    private readonly assertPlantingSpotExistsService: AssertPlantingSpotExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: MarkPlantingSpotFallowCommand): Promise<void> {
    const spot = await this.assertPlantingSpotExistsService.execute(command.id);

    if (spot.userId.value !== command.requestingUserId.value) {
      throw new PlantingSpotForbiddenException(
        command.requestingUserId.value,
        command.id.value,
      );
    }

    spot.markFallow();

    await this.plantingSpotWriteRepository.save(spot);
    await this.publishEvents(spot);

    this.logger.log(
      `PlantingSpot marked fallow: ${command.id.value} by user: ${command.requestingUserId.value}`,
    );
  }
}
