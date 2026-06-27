import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';

export const CARE_SCHEDULE_WRITE_REPOSITORY = Symbol(
  'CARE_SCHEDULE_WRITE_REPOSITORY',
);

export type ICareScheduleWriteRepository =
  IBaseWriteRepository<CareScheduleAggregate>;
