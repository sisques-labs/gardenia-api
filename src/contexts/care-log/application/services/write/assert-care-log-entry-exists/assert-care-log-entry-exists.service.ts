import { Inject, Injectable } from '@nestjs/common';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { CareLogEntryNotFoundException } from '@contexts/care-log/domain/exceptions/care-log-entry-not-found.exception';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';
import {
  CARE_LOG_ENTRY_WRITE_REPOSITORY,
  ICareLogEntryWriteRepository,
} from '@contexts/care-log/domain/repositories/write/care-log-entry-write.repository';

@Injectable()
export class AssertCareLogEntryExistsService {
  constructor(
    @Inject(CARE_LOG_ENTRY_WRITE_REPOSITORY)
    private readonly writeRepository: ICareLogEntryWriteRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<CareLogEntryAggregate> {
    const entry = await this.writeRepository.findById(id.value);
    if (!entry) throw new CareLogEntryNotFoundException(id.value);
    return entry;
  }
}
