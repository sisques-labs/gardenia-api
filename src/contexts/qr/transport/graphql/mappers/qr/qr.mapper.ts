import { Injectable } from '@nestjs/common';

import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrResponseDto } from '../../dtos/responses/qr/qr.response.dto';

@Injectable()
export class QrGraphQLMapper {
  toResponseDtoFromViewModel(vm: QrViewModel): QrResponseDto {
    return {
      id: vm.id,
      plantId: vm.plantId,
      spaceId: vm.spaceId,
      targetUrl: vm.targetUrl,
      generation: vm.generation,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }
}
