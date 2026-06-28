import { Inject, Injectable } from '@nestjs/common';

import { CareScheduleNotFoundException } from '@contexts/care-schedule/domain/exceptions/care-schedule-not-found.exception';
import {
  CARE_SCHEDULE_READ_REPOSITORY,
  ICareScheduleReadRepository,
} from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';

@Injectable()
export class AssertCareScheduleViewModelExistsService {
  constructor(
    @Inject(CARE_SCHEDULE_READ_REPOSITORY)
    private readonly careScheduleReadRepository: ICareScheduleReadRepository,
  ) {}

  async execute(id: CareScheduleIdValueObject): Promise<CareScheduleViewModel> {
    const schedule = await this.careScheduleReadRepository.findById(id.value);
    if (!schedule) throw new CareScheduleNotFoundException(id.value);
    return schedule;
  }
}
