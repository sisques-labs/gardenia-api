import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

export const CARE_LOG_ENTRY_READ_REPOSITORY = Symbol(
  'CARE_LOG_ENTRY_READ_REPOSITORY',
);

export interface ICareLogEntryReadRepository extends IBaseReadRepository<CareLogEntryViewModel> {
  findById(id: string): Promise<CareLogEntryViewModel | null>;
  findLastByType(
    plantId: string,
    activityType: string,
  ): Promise<CareLogEntryViewModel | null>;
}
