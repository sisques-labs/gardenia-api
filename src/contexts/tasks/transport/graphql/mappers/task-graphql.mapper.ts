import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';
import {
  PaginatedTaskResultDto,
  TaskGraphQLResponseDto,
} from '@contexts/tasks/transport/graphql/dtos/responses/task-graphql-response.dto';

@Injectable()
export class TaskGraphQLMapper {
  toResponseDto(vm: TaskViewModel): TaskGraphQLResponseDto {
    return {
      id: vm.id,
      templateId: vm.templateId,
      status: vm.status,
      payload: JSON.stringify(vm.payload),
      priority: vm.priority,
      delayMs: vm.delayMs,
      cronExpression: vm.cronExpression,
      isRecurring: vm.isRecurring,
      maxRuns: vm.maxRuns,
      runCount: vm.runCount,
      idempotencyKey: vm.idempotencyKey,
      userId: vm.userId,
      scheduledAt: vm.scheduledAt,
      startedAt: vm.startedAt,
      completedAt: vm.completedAt,
      failedAt: vm.failedAt,
      cancelledAt: vm.cancelledAt,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(result: PaginatedResult<TaskViewModel>): PaginatedTaskResultDto {
    return {
      items: result.items.map((vm) => this.toResponseDto(vm)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }
}
