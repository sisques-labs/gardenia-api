import { Injectable } from '@nestjs/common';

import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';

import { PlantingSpotRestResponseDto } from '../../dtos/planting-spot-rest-response.dto';

@Injectable()
export class PlantingSpotRestMapper {
  toResponse(vm: PlantingSpotViewModel): PlantingSpotRestResponseDto {
    const dto = new PlantingSpotRestResponseDto();
    dto.id = vm.id;
    dto.name = vm.name;
    dto.type = vm.type;
    dto.description = vm.description;
    dto.capacity = vm.capacity;
    dto.row = vm.row;
    dto.column = vm.column;
    dto.dimensions = vm.dimensions;
    dto.soilType = vm.soilType;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
