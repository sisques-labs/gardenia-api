import { Inject, Injectable } from '@nestjs/common';

import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { CareScheduleNotFoundException } from '@contexts/care-schedule/domain/exceptions/care-schedule-not-found.exception';
import {
  CARE_SCHEDULE_WRITE_REPOSITORY,
  ICareScheduleWriteRepository,
} from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';

@Injectable()
export class AssertCareScheduleExistsService {
  constructor(
    @Inject(CARE_SCHEDULE_WRITE_REPOSITORY)
    private readonly careScheduleWriteRepository: ICareScheduleWriteRepository,
  ) {}

  async execute(id: CareScheduleIdValueObject): Promise<CareScheduleAggregate> {
    const schedule = await this.careScheduleWriteRepository.findById(id.value);
    if (!schedule) throw new CareScheduleNotFoundException(id.value);
    return schedule;
  }
}
