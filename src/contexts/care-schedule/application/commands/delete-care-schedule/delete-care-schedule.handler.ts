import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertCareScheduleExistsService } from '@contexts/care-schedule/application/services/write/assert-care-schedule-exists/assert-care-schedule-exists.service';
import { DispatchCareScheduleDueNotificationService } from '@contexts/care-schedule/application/services/write/dispatch-care-schedule-due-notification/dispatch-care-schedule-due-notification.service';
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
    private readonly dispatchCareScheduleDueNotificationService: DispatchCareScheduleDueNotificationService,
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

    await this.dispatchCareScheduleDueNotificationService.execute({
      schedule,
      active: false,
    });
  }
}
