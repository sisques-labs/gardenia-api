import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  INVENTORY_ITEM_READ_REPOSITORY,
  IInventoryItemReadRepository,
} from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';

import { InventoryItemFindByCriteriaQuery } from './inventory-item-find-by-criteria.query';

@QueryHandler(InventoryItemFindByCriteriaQuery)
export class InventoryItemFindByCriteriaQueryHandler implements IQueryHandler<
  InventoryItemFindByCriteriaQuery,
  PaginatedResult<InventoryItemViewModel>
> {
  private readonly logger = new Logger(
    InventoryItemFindByCriteriaQueryHandler.name,
  );

  constructor(
    @Inject(INVENTORY_ITEM_READ_REPOSITORY)
    private readonly inventoryItemReadRepository: IInventoryItemReadRepository,
  ) {}

  async execute(
    query: InventoryItemFindByCriteriaQuery,
  ): Promise<PaginatedResult<InventoryItemViewModel>> {
    this.logger.log('Executing InventoryItemFindByCriteriaQuery');
    return this.inventoryItemReadRepository.findByCriteria(query.criteria);
  }
}
