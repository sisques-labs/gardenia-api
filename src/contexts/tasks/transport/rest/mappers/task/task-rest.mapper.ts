import { Injectable } from '@nestjs/common';

import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';
import { TaskRestResponseDto } from '@contexts/tasks/transport/rest/dtos/task-rest-response.dto';

@Injectable()
export class TaskRestMapper {
  toResponse(vm: TaskViewModel): TaskRestResponseDto {
    return {
      id: vm.id,
      templateId: vm.templateId,
      status: vm.status,
      payload: vm.payload,
      priority: vm.priority,
      delayMs: vm.delayMs,
      cronExpression: vm.cronExpression,
      isRecurring: vm.isRecurring,
      maxRuns: vm.maxRuns,
      runCount: vm.runCount,
      idempotencyKey: vm.idempotencyKey,
      userId: vm.userId,
      targetType: vm.targetType,
      targetId: vm.targetId,
      validFrom: vm.validFrom,
      validUntil: vm.validUntil,
      scheduledAt: vm.scheduledAt,
      startedAt: vm.startedAt,
      completedAt: vm.completedAt,
      failedAt: vm.failedAt,
      cancelledAt: vm.cancelledAt,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }
}
