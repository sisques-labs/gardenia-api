import { Injectable } from '@nestjs/common';

import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileRestResponseDto } from '../../dtos/file-rest-response.dto';

@Injectable()
export class FileRestMapper {
  toResponse(vm: FileViewModel): FileRestResponseDto {
    const dto = new FileRestResponseDto();
    dto.id = vm.id;
    dto.filename = vm.filename;
    dto.mimeType = vm.mimeType;
    dto.size = vm.size;
    dto.url = vm.url;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
