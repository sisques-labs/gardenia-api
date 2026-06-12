import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { CareLogEntryBuilder } from '@contexts/care-log/domain/builders/care-log-entry.builder';
import {
  CARE_LOG_ENTRY_WRITE_REPOSITORY,
  ICareLogEntryWriteRepository,
} from '@contexts/care-log/domain/repositories/write/care-log-entry-write.repository';

import { CreateCareLogEntryCommand } from './create-care-log-entry.command';

@CommandHandler(CreateCareLogEntryCommand)
export class CreateCareLogEntryCommandHandler
  extends BaseCommandHandler<CreateCareLogEntryCommand, CareLogEntryAggregate>
  implements ICommandHandler<CreateCareLogEntryCommand, string>
{
  private readonly logger = new Logger(CreateCareLogEntryCommandHandler.name);

  constructor(
    @Inject(CARE_LOG_ENTRY_WRITE_REPOSITORY)
    private readonly writeRepository: ICareLogEntryWriteRepository,
    private readonly builder: CareLogEntryBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateCareLogEntryCommand): Promise<string> {
    const now = new Date();
    const entryId = UuidValueObject.generate().value;

    const entry = this.builder
      .withId(entryId)
      .withPlantId(command.plantId.value)
      .withUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withActivityType(command.activityType.value)
      .withPerformedAt(command.performedAt?.value ?? now)
      .withNotes(command.notes?.value ?? null)
      .withQuantity(command.quantity?.value ?? null)
      .withUnit(command.unit?.value ?? null)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    entry.create();

    await this.writeRepository.save(entry);
    await this.publishEvents(entry);

    this.logger.log(
      `CareLogEntry created: ${entry.id.value} for plant: ${command.plantId.value}`,
    );

    return entry.id.value;
  }
}
