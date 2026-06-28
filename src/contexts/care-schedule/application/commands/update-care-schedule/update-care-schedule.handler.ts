import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

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
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdateCareScheduleCommand): Promise<void> {
    const schedule = await this.assertCareScheduleExistsService.execute(
      command.id,
    );

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
  }
}
