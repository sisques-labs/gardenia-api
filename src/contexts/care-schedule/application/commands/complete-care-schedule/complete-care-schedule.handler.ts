import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  CARE_LOG_PORT,
  ICareLogPort,
} from '@contexts/care-schedule/application/ports/care-log.port';
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
    @Inject(CARE_LOG_PORT)
    private readonly careLogPort: ICareLogPort,
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

    // Bridge to the care-log context: a completed schedule is a performed care
    // activity, so mirror it into the plant's care journal. Best-effort — a
    // care-log failure must not roll back the (authoritative) completion.
    await this.recordCareLogEntry(schedule, completedAt);
  }

  private async recordCareLogEntry(
    schedule: CareScheduleAggregate,
    performedAt: Date,
  ): Promise<void> {
    try {
      await this.careLogPort.recordCareLogEntry({
        plantId: schedule.plantId.value,
        userId: schedule.userId.value,
        spaceId: schedule.spaceId.value,
        activityType: schedule.activityType.value,
        performedAt,
        quantity: schedule.quantity?.value ?? null,
        unit: schedule.unit?.value ?? null,
      });
    } catch (error) {
      this.logger.warn(
        `Care schedule ${schedule.id.value} completed but care-log entry failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
