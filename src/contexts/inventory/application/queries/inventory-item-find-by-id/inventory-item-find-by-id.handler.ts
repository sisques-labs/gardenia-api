import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertInventoryItemViewModelExistsService } from '@contexts/inventory/application/services/read/assert-inventory-item-view-model-exists/assert-inventory-item-view-model-exists.service';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';

import { InventoryItemFindByIdQuery } from './inventory-item-find-by-id.query';

@QueryHandler(InventoryItemFindByIdQuery)
export class InventoryItemFindByIdQueryHandler implements IQueryHandler<
  InventoryItemFindByIdQuery,
  InventoryItemViewModel
> {
  private readonly logger = new Logger(InventoryItemFindByIdQueryHandler.name);

  constructor(
    private readonly assertInventoryItemViewModelExistsService: AssertInventoryItemViewModelExistsService,
  ) {}

  async execute(
    query: InventoryItemFindByIdQuery,
  ): Promise<InventoryItemViewModel> {
    this.logger.log(
      `Executing InventoryItemFindByIdQuery for item ${query.id.value}`,
    );
    return this.assertInventoryItemViewModelExistsService.execute(query.id);
  }
}
