import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';
import {
  PaginatedTaskTemplateResultDto,
  TaskTemplateGraphQLResponseDto,
} from '@contexts/tasks/transport/graphql/dtos/responses/task-template-graphql-response.dto';

@Injectable()
export class TaskTemplateGraphQLMapper {
  toResponseDto(vm: TaskTemplateViewModel): TaskTemplateGraphQLResponseDto {
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

  toPaginatedResponseDto(
    result: PaginatedResult<TaskTemplateViewModel>,
  ): PaginatedTaskTemplateResultDto {
    return {
      items: result.items.map((vm) => this.toResponseDto(vm)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }
}
