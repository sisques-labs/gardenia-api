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

import { UpdateCareScheduleCommand } from './update-care-schedule.command';

@CommandHandler(UpdateCareScheduleCommand)
export class UpdateCareScheduleCommandHandler
  extends BaseCommandHandler<UpdateCareScheduleCommand, CareScheduleAggregate>
  implements ICommandHandler<UpdateCareScheduleCommand, void>
{
  private readonly logger = new Logger(UpdateCareScheduleCommandHandler.name);

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

  async execute(command: UpdateCareScheduleCommand): Promise<void> {
    const schedule = await this.assertCareScheduleExistsService.execute(
      command.id,
    );
    const wasActive = schedule.active.value;

    schedule.update({
      activityType: command.activityType,
      intervalDays: command.intervalDays,
      quantity: command.quantity,
      unit: command.unit,
      notes: command.notes,
      active: command.active,
    });

    await this.careScheduleWriteRepository.save(schedule);
    await this.publishEvents(schedule);

    this.logger.log(`Care schedule updated: ${command.id.value}`);

    // Reminder follows the active flag: reactivating (re)schedules for the
    // current due date (immediately, if already overdue); deactivating
    // cancels the pending reminder. No change when active is untouched.
    if (!wasActive && schedule.active.value) {
      await this.scheduleReminder(schedule);
    } else if (wasActive && !schedule.active.value) {
      await this.cancelReminder(schedule);
    }
  }

  private async scheduleReminder(
    schedule: CareScheduleAggregate,
  ): Promise<void> {
    try {
      await this.reminderSchedulerPort.scheduleReminder({
        careScheduleId: schedule.id.value,
        userId: schedule.userId.value,
        plantId: schedule.plantId.value,
        activityType: schedule.activityType.value,
        dueAt: schedule.nextDueAt.value,
      });
    } catch (error) {
      this.logger.warn(
        `Care schedule ${schedule.id.value} updated but reminder scheduling failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async cancelReminder(schedule: CareScheduleAggregate): Promise<void> {
    try {
      await this.reminderSchedulerPort.cancelReminder(schedule.id.value);
    } catch (error) {
      this.logger.warn(
        `Care schedule ${schedule.id.value} updated but reminder cancellation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
