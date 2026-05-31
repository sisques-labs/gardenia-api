import { Injectable } from '@nestjs/common';

import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

import { PlantSpeciesRestResponseDto } from '../../dtos/plant-species-rest-response.dto';

@Injectable()
export class PlantSpeciesRestMapper {
  toResponse(vm: PlantSpeciesViewModel): PlantSpeciesRestResponseDto {
    const dto = new PlantSpeciesRestResponseDto();
    dto.id = vm.id;
    dto.name = vm.name;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
