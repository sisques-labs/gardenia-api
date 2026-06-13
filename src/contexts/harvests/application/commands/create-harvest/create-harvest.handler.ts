import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import { HarvestBuilder } from '@contexts/harvests/domain/builders/harvest.builder';
import {
  HARVEST_WRITE_REPOSITORY,
  IHarvestWriteRepository,
} from '@contexts/harvests/domain/repositories/write/harvest-write.repository';

import { CreateHarvestCommand } from './create-harvest.command';

@CommandHandler(CreateHarvestCommand)
export class CreateHarvestCommandHandler
  extends BaseCommandHandler<CreateHarvestCommand, HarvestAggregate>
  implements ICommandHandler<CreateHarvestCommand, string>
{
  private readonly logger = new Logger(CreateHarvestCommandHandler.name);

  constructor(
    @Inject(HARVEST_WRITE_REPOSITORY)
    private readonly harvestWriteRepository: IHarvestWriteRepository,
    private readonly harvestBuilder: HarvestBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateHarvestCommand): Promise<string> {
    const now = new Date();
    const harvestId = UuidValueObject.generate().value;

    const harvest = this.harvestBuilder
      .withId(harvestId)
      .withCropType(command.cropType.value)
      .withQuantity(command.quantity.value)
      .withUnit(command.unit.value)
      .withHarvestedAt(command.harvestedAt.value)
      .withUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    harvest.create();

    await this.harvestWriteRepository.save(harvest);
    await this.publishEvents(harvest);

    this.logger.log(
      `Harvest created: ${harvest.id.value} by user: ${command.userId.value}`,
    );

    return harvest.id.value;
  }
}
