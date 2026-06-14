import { Inject, Injectable } from '@nestjs/common';

import { CareLogEntryNotFoundException } from '@contexts/care-log/domain/exceptions/care-log-entry-not-found.exception';
import {
  CARE_LOG_ENTRY_READ_REPOSITORY,
  ICareLogEntryReadRepository,
} from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

@Injectable()
export class AssertCareLogEntryViewModelExistsService {
  constructor(
    @Inject(CARE_LOG_ENTRY_READ_REPOSITORY)
    private readonly readRepository: ICareLogEntryReadRepository,
  ) {}

  async execute(id: string): Promise<CareLogEntryViewModel> {
    const vm = await this.readRepository.findById(id);
    if (!vm) throw new CareLogEntryNotFoundException(id);
    return vm;
  }
}
