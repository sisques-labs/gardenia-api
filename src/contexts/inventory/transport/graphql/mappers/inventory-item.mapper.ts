import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import {
  InventoryItemResponseDto,
  PaginatedInventoryItemsResultDto,
} from '@contexts/inventory/transport/graphql/dtos/responses/inventory-item.response.dto';

@Injectable()
export class InventoryItemGraphQLMapper {
  private readonly logger = new Logger(InventoryItemGraphQLMapper.name);

  toResponseDto(vm: InventoryItemViewModel): InventoryItemResponseDto {
    this.logger.log(
      `Mapping inventory item view model to response dto: ${vm.id}`,
    );
    return {
      id: vm.id,
      itemType: vm.itemType as InventoryItemTypeEnum,
      name: vm.name,
      brand: vm.brand,
      notes: vm.notes,
      quantity: vm.quantity,
      unit: vm.unit as InventoryUnitEnum,
      lowStockThreshold: vm.lowStockThreshold,
      acquiredAt: vm.acquiredAt,
      expiresAt: vm.expiresAt,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<InventoryItemViewModel>,
  ): PaginatedInventoryItemsResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDto(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
