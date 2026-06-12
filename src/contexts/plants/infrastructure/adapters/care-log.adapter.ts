import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CareLogFindLastByTypeQuery } from '@contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.query';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { ICareLogPort } from '@contexts/plants/application/ports/care-log.port';

@Injectable()
export class CareLogAdapter implements ICareLogPort {
  private readonly logger = new Logger(CareLogAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async findLastActivityByType(
    plantId: string,
    activityType: string,
  ): Promise<Date | null> {
    this.logger.log(`Fetching last ${activityType} for plant ${plantId}`);

    const vm = await this.queryBus
      .execute<
        CareLogFindLastByTypeQuery,
        CareLogEntryViewModel | null
      >(new CareLogFindLastByTypeQuery({ plantId, activityType }))
      .catch(() => null);

    return vm?.performedAt ?? null;
  }
}
