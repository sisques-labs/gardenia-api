import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import { IExpiringItem } from '@contexts/notifications/application/ports/expiring-item.interface';
import { IInventoryAlertsPort } from '@contexts/notifications/application/ports/inventory-alerts.port';
import { ILowStockItem } from '@contexts/notifications/application/ports/low-stock-item.interface';
import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';

const PAGE_SIZE = 100;

@Injectable()
export class InventoryAlertsAdapter implements IInventoryAlertsPort {
  private readonly logger = new Logger(InventoryAlertsAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async findLowStock(): Promise<ILowStockItem[]> {
    const items = await this.fetchAll([
      { field: 'low_stock', operator: FilterOperator.EQUALS, value: true },
    ]);

    this.logger.log(`Found ${items.length} low-stock inventory items`);
    return items.map((item) => ({
      itemId: item.id,
      name: item.name,
      itemType: item.itemType,
      quantity: item.quantity,
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold ?? 0,
    }));
  }

  async findExpiringWithin(windowDays: number): Promise<IExpiringItem[]> {
    const expiringBefore = new Date(
      Date.now() + windowDays * 24 * 60 * 60 * 1000,
    );

    const items = await this.fetchAll([
      {
        field: 'expiresAt',
        operator: FilterOperator.LESS_THAN_OR_EQUAL,
        value: expiringBefore.toISOString(),
      },
    ]);

    this.logger.log(
      `Found ${items.length} inventory items expiring within ${windowDays} days`,
    );
    return items
      .filter((item) => item.expiresAt !== null)
      .map((item) => ({
        itemId: item.id,
        name: item.name,
        itemType: item.itemType,
        expiresAt: item.expiresAt as Date,
      }));
  }

  private async fetchAll(
    filters: { field: string; operator: FilterOperator; value: unknown }[],
  ): Promise<InventoryItemViewModel[]> {
    const results: InventoryItemViewModel[] = [];
    let page = 1;

    for (;;) {
      const criteria = new Criteria(filters, [], { page, perPage: PAGE_SIZE });
      const result: PaginatedResult<InventoryItemViewModel> =
        await this.queryBus.execute(
          new InventoryItemFindByCriteriaQuery(criteria),
        );
      results.push(...result.items);
      if (result.items.length < PAGE_SIZE) break;
      page += 1;
    }

    return results;
  }
}
