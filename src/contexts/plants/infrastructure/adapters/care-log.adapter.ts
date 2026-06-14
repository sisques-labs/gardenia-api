import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CareLogFindLastByTypeQuery } from '@contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.query';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
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

    const [
      watering,
      fertilizing,
      pruning,
      repotting,
      transplanting,
      pestTreatment,
      misting,
      rotation,
      other,
    ] = await Promise.all([
      this.queryLastByType(plantId, CareLogActivityTypeEnum.WATERING),
      this.queryLastByType(plantId, CareLogActivityTypeEnum.FERTILIZING),
      this.queryLastByType(plantId, CareLogActivityTypeEnum.PRUNING),
      this.queryLastByType(plantId, CareLogActivityTypeEnum.REPOTTING),
      this.queryLastByType(plantId, CareLogActivityTypeEnum.TRANSPLANTING),
      this.queryLastByType(plantId, CareLogActivityTypeEnum.PEST_TREATMENT),
      this.queryLastByType(plantId, CareLogActivityTypeEnum.MISTING),
      this.queryLastByType(plantId, CareLogActivityTypeEnum.ROTATION),
      this.queryLastByType(plantId, CareLogActivityTypeEnum.OTHER),
    ]);

    return {
      lastWateredAt: watering?.performedAt ?? null,
      lastFertilizedAt: fertilizing?.performedAt ?? null,
      lastPrunedAt: pruning?.performedAt ?? null,
      lastRepottedAt: repotting?.performedAt ?? null,
      lastTransplantedAt: transplanting?.performedAt ?? null,
      lastPestTreatmentAt: pestTreatment?.performedAt ?? null,
      lastMistedAt: misting?.performedAt ?? null,
      lastRotatedAt: rotation?.performedAt ?? null,
      lastOtherAt: other?.performedAt ?? null,
    };
  }

  private async queryLastByType(
    plantId: string,
    activityType: CareLogActivityTypeEnum,
  ): Promise<CareLogEntryViewModel | null> {
    return this.queryBus
      .execute<
        CareLogFindLastByTypeQuery,
        CareLogEntryViewModel | null
      >(new CareLogFindLastByTypeQuery({ plantId, activityType }))
      .catch(() => null);
  }
}
