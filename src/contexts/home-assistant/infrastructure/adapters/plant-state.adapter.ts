import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogFindLastByTypeQuery } from '@contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.query';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { IPlantStatePort } from '@contexts/home-assistant/application/ports/plant-state.port';
import { PlantHaState } from '@contexts/home-assistant/domain/interfaces/plant-ha-state.interface';
import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

/**
 * Reads plant + last-watering state through the Query bus. This adapter is the
 * only bridge component that knows about the plants/care-log contexts; the rest
 * of the bridge depends on {@link IPlantStatePort}.
 *
 * Callers MUST invoke this inside the target space's ALS frame so the tenant
 * repositories scope correctly (the reconcile service wraps it).
 */
@Injectable()
export class PlantStateAdapter implements IPlantStatePort {
  private readonly logger = new Logger(PlantStateAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async listPlantStates(spaceId: string): Promise<PlantHaState[]> {
    this.logger.log(`Reading plant states for space ${spaceId}`);

    const plants = await this.queryBus.execute<
      PlantFindByCriteriaQuery,
      PaginatedResult<PlantViewModel>
    >(new PlantFindByCriteriaQuery({ criteria: new Criteria() }));

    return Promise.all(
      plants.items.map(async (plant) => ({
        plantId: plant.id,
        name: plant.name,
        lastWateredAt: await this.lastWateredAt(plant.id),
      })),
    );
  }

  private async lastWateredAt(plantId: string): Promise<Date | null> {
    const entry = await this.queryBus.execute<
      CareLogFindLastByTypeQuery,
      CareLogEntryViewModel | null
    >(
      new CareLogFindLastByTypeQuery({
        plantId,
        activityType: CareLogActivityTypeEnum.WATERING,
      }),
    );
    return entry?.performedAt ?? null;
  }
}
