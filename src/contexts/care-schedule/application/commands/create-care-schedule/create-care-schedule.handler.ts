import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import {
  CARE_SCHEDULE_WRITE_REPOSITORY,
  ICareScheduleWriteRepository,
} from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';

import { CreateCareScheduleCommand } from './create-care-schedule.command';

@CommandHandler(CreateCareScheduleCommand)
export class CreateCareScheduleCommandHandler
  extends BaseCommandHandler<CreateCareScheduleCommand, CareScheduleAggregate>
  implements ICommandHandler<CreateCareScheduleCommand, string>
{
  private readonly logger = new Logger(CreateCareScheduleCommandHandler.name);

  constructor(
    @Inject(CARE_SCHEDULE_WRITE_REPOSITORY)
    private readonly careScheduleWriteRepository: ICareScheduleWriteRepository,
    private readonly careScheduleBuilder: CareScheduleBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateCareScheduleCommand): Promise<string> {
    const now = new Date();
    const careScheduleId = UuidValueObject.generate().value;

    const schedule = this.careScheduleBuilder
      .withId(careScheduleId)
      .withPlantId(command.plantId.value)
      .withActivityType(command.activityType.value)
      .withIntervalDays(command.intervalDays.value)
      .withQuantity(command.quantity?.value ?? null)
      .withUnit(command.unit?.value ?? null)
      .withNotes(command.notes?.value ?? null)
      .withNextDueAt(command.nextDueAt?.value ?? now)
      .withLastCompletedAt(null)
      .withActive(command.active?.value ?? true)
      .withUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    schedule.create();

    await this.careScheduleWriteRepository.save(schedule);
    await this.publishEvents(schedule);

    this.logger.log(
      `Care schedule created: ${schedule.id.value} by user: ${command.userId.value}`,
    );

    return schedule.id.value;
  }
}
