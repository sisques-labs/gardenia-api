import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import {
  HARVEST_WRITE_REPOSITORY,
  IHarvestWriteRepository,
} from '@contexts/harvests/domain/repositories/write/harvest-write.repository';
import { AssertHarvestExistsService } from '@contexts/harvests/application/services/write/assert-harvest-exists/assert-harvest-exists.service';

import { DeleteHarvestCommand } from './delete-harvest.command';

@CommandHandler(DeleteHarvestCommand)
export class DeleteHarvestCommandHandler
  extends BaseCommandHandler<DeleteHarvestCommand, HarvestAggregate>
  implements ICommandHandler<DeleteHarvestCommand, void>
{
  private readonly logger = new Logger(DeleteHarvestCommandHandler.name);

  constructor(
    @Inject(HARVEST_WRITE_REPOSITORY)
    private readonly harvestWriteRepository: IHarvestWriteRepository,
    private readonly assertHarvestExistsService: AssertHarvestExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteHarvestCommand): Promise<void> {
    const harvest = await this.assertHarvestExistsService.execute(command.id);

    harvest.delete();

    await this.harvestWriteRepository.delete(harvest.id.value);
    await this.publishEvents(harvest);

    this.logger.log(`Harvest deleted: ${command.id.value}`);
  }
}
