import { Injectable } from '@nestjs/common';

import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { PlantPhotoRestResponseDto } from '../../dtos/plant-photo-rest-response.dto';

@Injectable()
export class PlantPhotoRestMapper {
  toResponse(vm: PlantPhotoViewModel): PlantPhotoRestResponseDto {
    const dto = new PlantPhotoRestResponseDto();
    dto.id = vm.id;
    dto.plantId = vm.plantId;
    dto.fileId = vm.fileId;
    dto.url = vm.url;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
