import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { CareLogEntryForbiddenException } from '@contexts/care-log/domain/exceptions/care-log-entry-forbidden.exception';
import {
  CARE_LOG_ENTRY_WRITE_REPOSITORY,
  ICareLogEntryWriteRepository,
} from '@contexts/care-log/domain/repositories/write/care-log-entry-write.repository';
import { AssertCareLogEntryExistsService } from '@contexts/care-log/application/services/write/assert-care-log-entry-exists/assert-care-log-entry-exists.service';

import { DeleteCareLogEntryCommand } from './delete-care-log-entry.command';

@CommandHandler(DeleteCareLogEntryCommand)
export class DeleteCareLogEntryCommandHandler
  extends BaseCommandHandler<DeleteCareLogEntryCommand, CareLogEntryAggregate>
  implements ICommandHandler<DeleteCareLogEntryCommand, void>
{
  private readonly logger = new Logger(DeleteCareLogEntryCommandHandler.name);

  constructor(
    @Inject(CARE_LOG_ENTRY_WRITE_REPOSITORY)
    private readonly writeRepository: ICareLogEntryWriteRepository,
    private readonly assertExists: AssertCareLogEntryExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteCareLogEntryCommand): Promise<void> {
    const entry = await this.assertExists.execute(command.id);

    if (entry.userId.value !== command.requestingUserId.value) {
      throw new CareLogEntryForbiddenException(
        command.requestingUserId.value,
        command.id.value,
      );
    }

    entry.delete();

    await this.writeRepository.delete(entry.id.value);
    await this.publishEvents(entry);

    this.logger.log(
      `CareLogEntry deleted: ${command.id.value} by user: ${command.requestingUserId.value}`,
    );
  }
}
