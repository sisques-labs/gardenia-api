import { Injectable } from '@nestjs/common';

import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemRestResponseDto } from '../../dtos/inventory-item-rest-response.dto';

@Injectable()
export class InventoryItemRestMapper {
  toResponse(vm: InventoryItemViewModel): InventoryItemRestResponseDto {
    const dto = new InventoryItemRestResponseDto();
    dto.id = vm.id;
    dto.itemType = vm.itemType;
    dto.name = vm.name;
    dto.brand = vm.brand;
    dto.notes = vm.notes;
    dto.quantity = vm.quantity;
    dto.unit = vm.unit;
    dto.lowStockThreshold = vm.lowStockThreshold;
    dto.acquiredAt = vm.acquiredAt;
    dto.expiresAt = vm.expiresAt;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
