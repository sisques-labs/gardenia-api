import { Injectable } from '@nestjs/common';

import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpaceRestResponseDto } from '../../dtos/space-rest-response.dto';

@Injectable()
export class SpaceRestMapper {
  toResponse(vm: SpaceViewModel): SpaceRestResponseDto {
    const dto = new SpaceRestResponseDto();
    dto.id = vm.id;
    dto.name = vm.name;
    dto.ownerId = vm.ownerId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
