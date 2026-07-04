import { Injectable } from '@nestjs/common';

import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';

import { PlantingSpotRestResponseDto } from '../../dtos/planting-spot-rest-response.dto';

@Injectable()
export class PlantingSpotRestMapper {
  toResponse(vm: PlantingSpotViewModel): PlantingSpotRestResponseDto {
    const hasDimensions =
      vm.dimensionsWidth != null ||
      vm.dimensionsHeight != null ||
      vm.dimensionsLength != null;

    const dto = new PlantingSpotRestResponseDto();
    dto.id = vm.id;
    dto.name = vm.name;
    dto.type = vm.type;
    dto.description = vm.description;
    dto.capacity = vm.capacity;
    dto.row = vm.row;
    dto.column = vm.column;
    dto.dimensions = hasDimensions
      ? {
          width: vm.dimensionsWidth,
          height: vm.dimensionsHeight,
          length: vm.dimensionsLength,
        }
      : null;
    dto.soilType = vm.soilType;
    dto.status = vm.status as PlantingSpotStatusEnum;
    dto.fallowSince = vm.fallowSince;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
