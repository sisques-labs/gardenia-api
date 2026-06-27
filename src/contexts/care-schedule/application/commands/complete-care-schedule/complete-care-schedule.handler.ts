import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertCareScheduleExistsService } from '@contexts/care-schedule/application/services/write/assert-care-schedule-exists/assert-care-schedule-exists.service';
import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import {
  CARE_SCHEDULE_WRITE_REPOSITORY,
  ICareScheduleWriteRepository,
} from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';

import { CompleteCareScheduleCommand } from './complete-care-schedule.command';

@CommandHandler(CompleteCareScheduleCommand)
export class CompleteCareScheduleCommandHandler
  extends BaseCommandHandler<CompleteCareScheduleCommand, CareScheduleAggregate>
  implements ICommandHandler<CompleteCareScheduleCommand, void>
{
  private readonly logger = new Logger(CompleteCareScheduleCommandHandler.name);

  constructor(
    @Inject(CARE_SCHEDULE_WRITE_REPOSITORY)
    private readonly careScheduleWriteRepository: ICareScheduleWriteRepository,
    private readonly assertCareScheduleExistsService: AssertCareScheduleExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CompleteCareScheduleCommand): Promise<void> {
    const schedule = await this.assertCareScheduleExistsService.execute(
      command.id,
    );

    const completedAt = command.completedAt?.value ?? new Date();
    schedule.complete(completedAt);

    await this.careScheduleWriteRepository.save(schedule);
    await this.publishEvents(schedule);

    this.logger.log(
      `Care schedule completed: ${command.id.value} next due: ${schedule.nextDueAt.value.toISOString()}`,
    );
  }
}
