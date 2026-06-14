import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CareLogFindLastByTypeQuery } from '@contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.query';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import {
  CareLogSummary,
  ICareLogPort,
} from '@contexts/plants/application/ports/care-log.port';

@Injectable()
export class CareLogAdapter implements ICareLogPort {
  private readonly logger = new Logger(CareLogAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async getCareLogSummary(plantId: string): Promise<CareLogSummary> {
    this.logger.log(`Fetching care log summary for plant ${plantId}`);

    const [watering, fertilizing] = await Promise.all([
      this.queryBus
        .execute<CareLogFindLastByTypeQuery, CareLogEntryViewModel | null>(
          new CareLogFindLastByTypeQuery({
            plantId,
            activityType: new CareLogActivityTypeValueObject(
              CareLogActivityTypeEnum.WATERING,
            ),
          }),
        )
        .catch(() => null),
      this.queryBus
        .execute<CareLogFindLastByTypeQuery, CareLogEntryViewModel | null>(
          new CareLogFindLastByTypeQuery({
            plantId,
            activityType: new CareLogActivityTypeValueObject(
              CareLogActivityTypeEnum.FERTILIZING,
            ),
          }),
        )
        .catch(() => null),
    ]);

    return {
      lastWateredAt: watering?.performedAt ?? null,
      lastFertilizedAt: fertilizing?.performedAt ?? null,
    };
  }
}
