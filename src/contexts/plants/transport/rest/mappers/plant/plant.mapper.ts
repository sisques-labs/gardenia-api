import { Injectable } from '@nestjs/common';

import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import {
  PlantRestResponseDto,
  PlantSpeciesRestResponseDto,
} from '../../dtos/plant-rest-response.dto';

@Injectable()
export class PlantRestMapper {
  toResponse(vm: PlantViewModel): PlantRestResponseDto {
    const dto = new PlantRestResponseDto();
    dto.id = vm.id;
    dto.name = vm.name;
    dto.plantSpeciesId = vm.plantSpeciesId;
    dto.species = vm.species ? this.toSpeciesResponse(vm.species) : null;
    dto.imageUrl = vm.imageUrl;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.qr = vm.qr ?? null;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }

  private toSpeciesResponse(
    species: NonNullable<PlantViewModel['species']>,
  ): PlantSpeciesRestResponseDto {
    const dto = new PlantSpeciesRestResponseDto();
    dto.id = species.id;
    dto.name = species.name;
    dto.createdAt = species.createdAt;
    dto.updatedAt = species.updatedAt;
    return dto;
  }
}
