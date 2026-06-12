import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';

export const CARE_LOG_ENTRY_WRITE_REPOSITORY = Symbol(
  'CARE_LOG_ENTRY_WRITE_REPOSITORY',
);

export interface ICareLogEntryWriteRepository extends IBaseWriteRepository<CareLogEntryAggregate> {
  findById(id: string): Promise<CareLogEntryAggregate | null>;
  delete(id: string): Promise<void>;
}
