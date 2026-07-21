import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  IReminderSchedulerPort,
  REMINDER_SCHEDULER_PORT,
} from '@contexts/care-schedule/application/ports/reminder-scheduler.port';
import { AssertCareScheduleExistsService } from '@contexts/care-schedule/application/services/write/assert-care-schedule-exists/assert-care-schedule-exists.service';
import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import {
  CARE_SCHEDULE_WRITE_REPOSITORY,
  ICareScheduleWriteRepository,
} from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';

import { DeleteCareScheduleCommand } from './delete-care-schedule.command';

@CommandHandler(DeleteCareScheduleCommand)
export class DeleteCareScheduleCommandHandler
  extends BaseCommandHandler<DeleteCareScheduleCommand, CareScheduleAggregate>
  implements ICommandHandler<DeleteCareScheduleCommand, void>
{
  private readonly logger = new Logger(DeleteCareScheduleCommandHandler.name);

  constructor(
    @Inject(CARE_SCHEDULE_WRITE_REPOSITORY)
    private readonly careScheduleWriteRepository: ICareScheduleWriteRepository,
    private readonly assertCareScheduleExistsService: AssertCareScheduleExistsService,
    @Inject(REMINDER_SCHEDULER_PORT)
    private readonly reminderSchedulerPort: IReminderSchedulerPort,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteCareScheduleCommand): Promise<void> {
    const schedule = await this.assertCareScheduleExistsService.execute(
      command.id,
    );

    schedule.delete();

    await this.careScheduleWriteRepository.delete(schedule.id.value);
    await this.publishEvents(schedule);

    this.logger.log(`Care schedule deleted: ${command.id.value}`);

    try {
      await this.reminderSchedulerPort.cancelReminder(schedule.id.value);
    } catch (error) {
      this.logger.warn(
        `Care schedule ${schedule.id.value} deleted but reminder cancellation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
