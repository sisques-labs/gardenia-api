import { Inject, Injectable } from '@nestjs/common';

import { CareScheduleNotFoundException } from '@contexts/care-schedule/domain/exceptions/care-schedule-not-found.exception';
import {
  CARE_SCHEDULE_READ_REPOSITORY,
  ICareScheduleReadRepository,
} from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';

import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertCareScheduleViewModelExistsService {
  constructor(
    @Inject(CARE_SCHEDULE_READ_REPOSITORY)
    private readonly careScheduleReadRepository: ICareScheduleReadRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<CareScheduleViewModel> {
    const schedule = await this.careScheduleReadRepository.findById(id.value);
    if (!schedule) throw new CareScheduleNotFoundException(id.value);
    return schedule;
  }
}
