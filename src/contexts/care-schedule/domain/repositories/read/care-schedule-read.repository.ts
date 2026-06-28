import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';

export const CARE_SCHEDULE_READ_REPOSITORY = Symbol(
  'CARE_SCHEDULE_READ_REPOSITORY',
);

export type ICareScheduleReadRepository =
  IBaseReadRepository<CareScheduleViewModel>;
