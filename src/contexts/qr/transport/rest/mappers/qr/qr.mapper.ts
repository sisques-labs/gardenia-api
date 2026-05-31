import { Injectable } from '@nestjs/common';

import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrRestResponseDto } from '../../dtos/qr-rest-response.dto';

@Injectable()
export class QrRestMapper {
  toResponseDto(viewModel: QrViewModel): QrRestResponseDto {
    const dto = new QrRestResponseDto();
    dto.id = viewModel.id;
    dto.spaceId = viewModel.spaceId;
    dto.targetUrl = viewModel.targetUrl;
    dto.generation = viewModel.generation;
    dto.createdAt = viewModel.createdAt;
    dto.updatedAt = viewModel.updatedAt;
    return dto;
  }
}
