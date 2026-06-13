import { Injectable } from '@nestjs/common';

import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { HarvestRestResponseDto } from '../../dtos/harvest-rest-response.dto';

@Injectable()
export class HarvestRestMapper {
  toResponse(vm: HarvestViewModel): HarvestRestResponseDto {
    const dto = new HarvestRestResponseDto();
    dto.id = vm.id;
    dto.cropType = vm.cropType;
    dto.quantity = vm.quantity;
    dto.unit = vm.unit;
    dto.harvestedAt = vm.harvestedAt;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
