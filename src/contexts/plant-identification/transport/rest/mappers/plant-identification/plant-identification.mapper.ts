import { Injectable } from '@nestjs/common';

import { IdentifyPlantResult } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.result';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { IdentifyPlantResponseDto } from '../../dtos/identify-plant-response.dto';
import { PlantIdentificationRestResponseDto } from '../../dtos/plant-identification-rest-response.dto';

@Injectable()
export class PlantIdentificationRestMapper {
  toIdentifyResponse(result: IdentifyPlantResult): IdentifyPlantResponseDto {
    const dto = new IdentifyPlantResponseDto();
    dto.id = result.id;
    dto.status = result.status;
    dto.resolved = result.resolved;
    dto.candidates = result.candidates;
    dto.photos = result.photos.map((photo) => ({
      url: photo.url,
      organ: photo.organ,
      position: photo.position,
    }));
    dto.createdAt = result.createdAt;
    return dto;
  }

  toResponse(
    vm: PlantIdentificationViewModel,
  ): PlantIdentificationRestResponseDto {
    const dto = new PlantIdentificationRestResponseDto();
    dto.id = vm.id;
    dto.requestedByUserId = vm.requestedByUserId;
    dto.spaceId = vm.spaceId;
    dto.status = vm.status;
    dto.resolvedGbifKey = vm.resolvedGbifKey;
    dto.resolvedScientificName = vm.resolvedScientificName;
    dto.convertedToPlantId = vm.convertedToPlantId;
    dto.photos = vm.photos;
    dto.candidates = vm.candidates;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
