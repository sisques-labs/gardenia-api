import { Injectable } from '@nestjs/common';

import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import { PlantRestResponseDto } from '../../dtos/plant-rest-response.dto';

@Injectable()
export class PlantRestMapper {
  toResponse(vm: PlantViewModel): PlantRestResponseDto {
    const dto = new PlantRestResponseDto();
    dto.id = vm.id;
    dto.name = vm.name;
    dto.species = vm.species;
    dto.imageUrl = vm.imageUrl;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.qr = vm.qr ?? null;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
