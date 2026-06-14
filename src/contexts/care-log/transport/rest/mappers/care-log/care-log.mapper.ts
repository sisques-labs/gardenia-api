import { Injectable } from '@nestjs/common';

import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CareLogRestResponseDto } from '@contexts/care-log/transport/rest/dtos/care-log-rest-response.dto';

@Injectable()
export class CareLogRestMapper {
  toResponse(vm: CareLogEntryViewModel): CareLogRestResponseDto {
    const dto = new CareLogRestResponseDto();
    dto.id = vm.id;
    dto.plantId = vm.plantId;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.activityType = vm.activityType;
    dto.performedAt = vm.performedAt;
    dto.notes = vm.notes;
    dto.quantity = vm.quantity;
    dto.unit = vm.unit;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
