import { Injectable } from '@nestjs/common';

import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';
import { TaskTemplateRestResponseDto } from '@contexts/tasks/transport/rest/dtos/task-template-rest-response.dto';

@Injectable()
export class TaskTemplateRestMapper {
  toResponse(vm: TaskTemplateViewModel): TaskTemplateRestResponseDto {
    return {
      id: vm.id,
      name: vm.name,
      description: vm.description,
      taskTitle: vm.taskTitle,
      taskDescription: vm.taskDescription,
      handlerKey: vm.handlerKey,
      defaultPriority: vm.defaultPriority,
      defaultRetryCount: vm.defaultRetryCount,
      defaultBackoffStrategy: vm.defaultBackoffStrategy,
      defaultTimeoutMs: vm.defaultTimeoutMs,
      maxConcurrency: vm.maxConcurrency,
      defaultCronExpression: vm.defaultCronExpression,
      defaultIsRecurring: vm.defaultIsRecurring,
      userId: vm.userId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }
}
