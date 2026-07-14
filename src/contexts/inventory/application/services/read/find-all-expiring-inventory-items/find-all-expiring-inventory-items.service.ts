import { Inject, Injectable } from '@nestjs/common';
import {
  Criteria,
  FilterOperator,
  IBaseService,
} from '@sisques-labs/nestjs-kit';

import {
  INVENTORY_ITEM_READ_REPOSITORY,
  IInventoryItemReadRepository,
} from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemQueryableField } from '@contexts/inventory/transport/graphql/enums/inventory-item-queryable-field.enum';
import { fetchAllPages } from '@shared/pagination/fetch-all-pages.util';

export interface FindAllExpiringInventoryItemsServiceInput {
  expiringBefore: Date;
}

/**
 * Pages through every inventory item expiring before the given instant.
 * Used by the expiring-reconciliation cron, which must sweep the whole
 * space regardless of how many items are expiring.
 */
@Injectable()
export class FindAllExpiringInventoryItemsService implements IBaseService<
  FindAllExpiringInventoryItemsServiceInput,
  InventoryItemViewModel[]
> {
  constructor(
    @Inject(INVENTORY_ITEM_READ_REPOSITORY)
    private readonly inventoryItemReadRepository: IInventoryItemReadRepository,
  ) {}

  async execute(
    input: FindAllExpiringInventoryItemsServiceInput,
  ): Promise<InventoryItemViewModel[]> {
    return fetchAllPages((page, perPage) => {
      const criteria = new Criteria(
        [
          {
            field: InventoryItemQueryableField.EXPIRES_AT,
            operator: FilterOperator.LESS_THAN_OR_EQUAL,
            value: input.expiringBefore.toISOString(),
          },
        ],
        undefined,
        { page, perPage },
      );
      return this.inventoryItemReadRepository.findByCriteria(criteria);
    });
  }
}
