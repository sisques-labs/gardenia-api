import { Injectable } from '@nestjs/common';

import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';
import { NotificationRestResponseDto } from '../../dtos/notification-rest-response.dto';

@Injectable()
export class NotificationRestMapper {
  toResponse(vm: NotificationViewModel): NotificationRestResponseDto {
    const dto = new NotificationRestResponseDto();
    dto.id = vm.id;
    dto.type = vm.type;
    dto.referenceType = vm.referenceType;
    dto.referenceId = vm.referenceId;
    dto.payload = vm.payload;
    dto.status = vm.status;
    dto.readAt = vm.readAt;
    dto.resolvedAt = vm.resolvedAt;
    dto.userId = vm.userId;
    dto.spaceId = vm.spaceId;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    return dto;
  }
}
