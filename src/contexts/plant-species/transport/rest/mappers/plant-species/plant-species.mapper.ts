import { Injectable } from '@nestjs/common';

import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

import { PlantSpeciesRestResponseDto } from '@contexts/plant-species/transport/rest/dtos/plant-species-rest-response.dto';

@Injectable()
export class PlantSpeciesRestMapper {
  toResponse(vm: PlantSpeciesViewModel): PlantSpeciesRestResponseDto {
    const dto = new PlantSpeciesRestResponseDto();
    dto.id = vm.id;
    dto.scientificName = vm.scientificName;
    dto.description = vm.description;
    dto.imageUrl = vm.imageUrl;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
