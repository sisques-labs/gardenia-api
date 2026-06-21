import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { HarvestFindByCriteriaQuery } from '@contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.query';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { ISpaceSummaryPort } from '@contexts/home-assistant/application/ports/space-summary.port';
import { SpaceHaSummary } from '@contexts/home-assistant/domain/interfaces/space-ha-summary.interface';
import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

// Single large page is enough to derive counts + low-stock for a home space.
const ALL = { page: 1, perPage: 1000 };

/**
 * Computes per-space aggregate counts by querying the plants, harvests and
 * inventory contexts through the Query bus. Boundary-safe: this adapter is the
 * only bridge component that references those contexts.
 *
 * Must run inside the target space's ALS frame (the reconcile service wraps it).
 */
@Injectable()
export class SpaceSummaryAdapter implements ISpaceSummaryPort {
  private readonly logger = new Logger(SpaceSummaryAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async getSummary(spaceId: string): Promise<SpaceHaSummary> {
    this.logger.log(`Reading summary for space ${spaceId}`);

    const [plants, harvests, inventory] = await Promise.all([
      this.queryBus.execute<
        PlantFindByCriteriaQuery,
        PaginatedResult<PlantViewModel>
      >(
        new PlantFindByCriteriaQuery({
          criteria: new Criteria(undefined, undefined, ALL),
        }),
      ),
      this.queryBus.execute<
        HarvestFindByCriteriaQuery,
        PaginatedResult<HarvestViewModel>
      >(
        new HarvestFindByCriteriaQuery(new Criteria(undefined, undefined, ALL)),
      ),
      this.queryBus.execute<
        InventoryItemFindByCriteriaQuery,
        PaginatedResult<InventoryItemViewModel>
      >(
        new InventoryItemFindByCriteriaQuery(
          new Criteria(undefined, undefined, ALL),
        ),
      ),
    ]);

    const lastHarvestAt = harvests.items.reduce<Date | null>(
      (latest, harvest) =>
        !latest || harvest.harvestedAt > latest ? harvest.harvestedAt : latest,
      null,
    );

    const lowStockCount = inventory.items.filter(
      (item) =>
        item.lowStockThreshold !== null &&
        item.quantity <= item.lowStockThreshold,
    ).length;

    return {
      plantCount: plants.total,
      harvestCount: harvests.total,
      lastHarvestAt,
      inventoryItemCount: inventory.total,
      lowStockCount,
    };
  }
}
