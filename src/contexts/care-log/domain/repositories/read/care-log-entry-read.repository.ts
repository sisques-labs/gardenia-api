import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

export const CARE_LOG_ENTRY_READ_REPOSITORY = Symbol(
  'CARE_LOG_ENTRY_READ_REPOSITORY',
);

export interface Pagination {
  page: number;
  limit: number;
}

export interface CareLogSpaceCriteria extends Pagination {
  activityTypes?: string[];
  fromDate?: Date;
  toDate?: Date;
}

export interface ICareLogEntryReadRepository extends IBaseReadRepository<CareLogEntryViewModel> {
  findById(id: string): Promise<CareLogEntryViewModel | null>;
  findByPlant(
    plantId: string,
    pagination: Pagination,
  ): Promise<CareLogEntryViewModel[]>;
  findBySpace(criteria: CareLogSpaceCriteria): Promise<CareLogEntryViewModel[]>;
  findLastByType(
    plantId: string,
    activityType: string,
  ): Promise<CareLogEntryViewModel | null>;
}
