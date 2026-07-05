import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import {
  CARE_LOG_ENTRY_WRITE_REPOSITORY,
  ICareLogEntryWriteRepository,
} from '@contexts/care-log/domain/repositories/write/care-log-entry-write.repository';
import { AssertCareLogEntryExistsService } from '@contexts/care-log/application/services/write/assert-care-log-entry-exists/assert-care-log-entry-exists.service';

import { UpdateCareLogEntryCommand } from './update-care-log-entry.command';

@CommandHandler(UpdateCareLogEntryCommand)
export class UpdateCareLogEntryCommandHandler
  extends BaseCommandHandler<UpdateCareLogEntryCommand, CareLogEntryAggregate>
  implements ICommandHandler<UpdateCareLogEntryCommand, void>
{
  private readonly logger = new Logger(UpdateCareLogEntryCommandHandler.name);

  constructor(
    @Inject(CARE_LOG_ENTRY_WRITE_REPOSITORY)
    private readonly writeRepository: ICareLogEntryWriteRepository,
    private readonly assertExists: AssertCareLogEntryExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdateCareLogEntryCommand): Promise<void> {
    const entry = await this.assertExists.execute(command.id);

    entry.update({
      activityType: command.activityType,
      performedAt: command.performedAt,
      notes: command.notes,
      quantity: command.quantity,
      unit: command.unit,
    });

    await this.writeRepository.save(entry);
    await this.publishEvents(entry);

    this.logger.log(
      `CareLogEntry updated: ${command.id.value} by user: ${command.requestingUserId.value}`,
    );
  }
}
