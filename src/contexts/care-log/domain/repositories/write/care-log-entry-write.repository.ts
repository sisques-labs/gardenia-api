import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';

export const CARE_LOG_ENTRY_WRITE_REPOSITORY = Symbol(
  'CARE_LOG_ENTRY_WRITE_REPOSITORY',
);

export type ICareLogEntryWriteRepository =
  IBaseWriteRepository<CareLogEntryAggregate>;
