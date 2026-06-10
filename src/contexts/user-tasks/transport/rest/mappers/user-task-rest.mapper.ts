import { Injectable } from '@nestjs/common';

import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';
import { UserTaskRestResponseDto } from '../dtos/user-task-rest-response.dto';

@Injectable()
export class UserTaskRestMapper {
  toResponse(vm: UserTaskViewModel): UserTaskRestResponseDto {
    return {
      id: vm.id,
      title: vm.title,
      description: vm.description,
      status: vm.status,
      scheduledDate: vm.scheduledDate,
      taskTemplateId: vm.taskTemplateId,
      userId: vm.userId,
      completedAt: vm.completedAt,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }
}
