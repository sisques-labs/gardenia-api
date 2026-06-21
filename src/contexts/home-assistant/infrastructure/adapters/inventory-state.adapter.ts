import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IInventoryStatePort } from '@contexts/home-assistant/application/ports/inventory-state.port';
import { InventoryHaState } from '@contexts/home-assistant/domain/interfaces/inventory-ha-state.interface';
import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';

const ALL = { page: 1, perPage: 1000 };

/**
 * Lists inventory items for a space via the Query bus. Boundary-safe; must run
 * inside the space's ALS frame (the reconcile service wraps it).
 */
@Injectable()
export class InventoryStateAdapter implements IInventoryStatePort {
  private readonly logger = new Logger(InventoryStateAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async listInventory(spaceId: string): Promise<InventoryHaState[]> {
    this.logger.log(`Reading inventory for space ${spaceId}`);

    const result = await this.queryBus.execute<
      InventoryItemFindByCriteriaQuery,
      PaginatedResult<InventoryItemViewModel>
    >(
      new InventoryItemFindByCriteriaQuery(
        new Criteria(undefined, undefined, ALL),
      ),
    );

    return result.items.map((item) => ({
      itemId: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    }));
  }
}
