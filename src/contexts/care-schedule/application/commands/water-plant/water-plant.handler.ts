import { Inject, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import { CompleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.command';
import {
  CARE_LOG_PORT,
  ICareLogPort,
} from '@contexts/care-schedule/application/ports/care-log.port';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import {
  CARE_SCHEDULE_READ_REPOSITORY,
  ICareScheduleReadRepository,
} from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';

import { WaterPlantCommand } from './water-plant.command';
import { WaterPlantResult } from './water-plant.result';

@CommandHandler(WaterPlantCommand)
export class WaterPlantCommandHandler implements ICommandHandler<
  WaterPlantCommand,
  WaterPlantResult
> {
  private readonly logger = new Logger(WaterPlantCommandHandler.name);

  constructor(
    @Inject(CARE_SCHEDULE_READ_REPOSITORY)
    private readonly careScheduleReadRepository: ICareScheduleReadRepository,
    @Inject(CARE_LOG_PORT)
    private readonly careLogPort: ICareLogPort,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: WaterPlantCommand): Promise<WaterPlantResult> {
    const performedAt = command.performedAt ?? new Date();

    const criteria = new Criteria(
      [
        {
          field: 'plantId',
          operator: FilterOperator.EQUALS,
          value: command.plantId.value,
        },
        {
          field: 'activityType',
          operator: FilterOperator.EQUALS,
          value: CareScheduleActivityTypeEnum.WATERING,
        },
        { field: 'active', operator: FilterOperator.EQUALS, value: true },
      ],
      undefined,
      { page: 1, perPage: 1 },
    );

    const { items } =
      await this.careScheduleReadRepository.findByCriteria(criteria);
    const schedule = items[0];

    if (schedule) {
      await this.commandBus.execute(
        new CompleteCareScheduleCommand({
          id: schedule.id,
          completedAt: performedAt,
        }),
      );
      this.logger.log(
        `Watered plant ${command.plantId.value} by completing care schedule ${schedule.id}`,
      );
      return {
        plantId: command.plantId.value,
        mode: 'SCHEDULE_COMPLETED',
        careScheduleId: schedule.id,
      };
    }

    await this.careLogPort.recordCareLogEntry({
      plantId: command.plantId.value,
      userId: command.userId.value,
      spaceId: command.spaceId.value,
      activityType: CareScheduleActivityTypeEnum.WATERING,
      performedAt,
      quantity: null,
      unit: null,
    });
    this.logger.log(
      `Watered plant ${command.plantId.value} via ad-hoc care-log entry (no active WATERING schedule)`,
    );
    return { plantId: command.plantId.value, mode: 'CARE_LOG_CREATED' };
  }
}
