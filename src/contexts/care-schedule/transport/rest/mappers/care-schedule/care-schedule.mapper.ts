import { Injectable } from '@nestjs/common';

import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleRestResponseDto } from '../../dtos/care-schedule-rest-response.dto';

@Injectable()
export class CareScheduleRestMapper {
  toResponse(vm: CareScheduleViewModel): CareScheduleRestResponseDto {
    const dto = new CareScheduleRestResponseDto();
    dto.id = vm.id;
    dto.plantId = vm.plantId;
    dto.activityType = vm.activityType;
    dto.intervalDays = vm.intervalDays;
    dto.quantity = vm.quantity;
    dto.unit = vm.unit;
    dto.notes = vm.notes;
    dto.nextDueAt = vm.nextDueAt;
    dto.lastCompletedAt = vm.lastCompletedAt;
    dto.active = vm.active;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
