import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import {
  HARVEST_WRITE_REPOSITORY,
  IHarvestWriteRepository,
} from '@contexts/harvests/domain/repositories/write/harvest-write.repository';
import { AssertHarvestExistsService } from '@contexts/harvests/application/services/write/assert-harvest-exists/assert-harvest-exists.service';

import { UpdateHarvestCommand } from './update-harvest.command';

@CommandHandler(UpdateHarvestCommand)
export class UpdateHarvestCommandHandler
  extends BaseCommandHandler<UpdateHarvestCommand, HarvestAggregate>
  implements ICommandHandler<UpdateHarvestCommand, void>
{
  private readonly logger = new Logger(UpdateHarvestCommandHandler.name);

  constructor(
    @Inject(HARVEST_WRITE_REPOSITORY)
    private readonly harvestWriteRepository: IHarvestWriteRepository,
    private readonly assertHarvestExistsService: AssertHarvestExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdateHarvestCommand): Promise<void> {
    const harvest = await this.assertHarvestExistsService.execute(command.id);

    harvest.update({
      cropType: command.cropType,
      quantity: command.quantity,
      unit: command.unit,
      harvestedAt: command.harvestedAt,
    });

    await this.harvestWriteRepository.save(harvest);
    await this.publishEvents(harvest);

    this.logger.log(`Harvest updated: ${command.id.value}`);
  }
}
