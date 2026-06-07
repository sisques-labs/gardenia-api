import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { TaskFindByCriteriaQuery } from '@contexts/tasks/application/queries/task-find-by-criteria/task-find-by-criteria.query';
import { TaskFindByIdQuery } from '@contexts/tasks/application/queries/task-find-by-id/task-find-by-id.query';
import { TaskRunFindByTaskQuery } from '@contexts/tasks/application/queries/task-run-find-by-task/task-run-find-by-task.query';
import { TaskNotFoundException } from '@contexts/tasks/domain/exceptions/task-not-found.exception';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';
import { TaskFindByCriteriaGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/task-find-by-criteria-graphql.dto';
import { TaskFindByIdGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/task-find-by-id-graphql.dto';
import { TaskRunsFindByTaskIdGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/task-runs-find-by-task-id-graphql.dto';
import {
  PaginatedTaskResultDto,
  TaskGraphQLResponseDto,
  TaskRunGraphQLResponseDto,
} from '@contexts/tasks/transport/graphql/dtos/responses/task-graphql-response.dto';
import { TaskGraphQLMapper } from '@contexts/tasks/transport/graphql/mappers/task-graphql.mapper';

@Resolver()
@UseGuards(JwtAuthGuard)
export class TaskQueriesResolver {
  private readonly logger = new Logger(TaskQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly mapper: TaskGraphQLMapper,
  ) {}

  @Query(() => TaskGraphQLResponseDto)
  async taskFindById(
    @Args('input') input: TaskFindByIdGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskGraphQLResponseDto> {
    this.logger.log(`Finding task by id: ${input.id}`);
    const vm = await this.queryBus.execute<TaskFindByIdQuery, TaskViewModel>(
      new TaskFindByIdQuery({ id: input.id }),
    );
    if (vm.userId !== user.userId) throw new TaskNotFoundException(input.id);
    return this.mapper.toResponseDto(vm);
  }

  @Query(() => PaginatedTaskResultDto)
  async taskFindByCriteria(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input', { nullable: true }) input?: TaskFindByCriteriaGraphQLDto,
  ): Promise<PaginatedTaskResultDto> {
    this.logger.log(`Finding tasks by criteria for user: ${user.userId}`);
    const criteria = new Criteria(
      [
        ...(input?.filters ?? []),
        {
          field: 'userId',
          operator: FilterOperator.EQUALS,
          value: user.userId,
        },
      ],
      input?.sorts,
      input?.pagination,
    );
    const result = await this.queryBus.execute(
      new TaskFindByCriteriaQuery({ criteria }),
    );
    return this.mapper.toPaginatedResponseDto(result);
  }

  @Query(() => [TaskRunGraphQLResponseDto])
  async taskRunsFindByTaskId(
    @Args('input') input: TaskRunsFindByTaskIdGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskRunGraphQLResponseDto[]> {
    this.logger.log(`Finding task runs for task: ${input.taskId}`);
    const ownership = await this.queryBus.execute(
      new TaskFindByCriteriaQuery({
        criteria: new Criteria([
          { field: 'id', operator: FilterOperator.EQUALS, value: input.taskId },
          {
            field: 'userId',
            operator: FilterOperator.EQUALS,
            value: user.userId,
          },
        ]),
      }),
    );
    if (!ownership.items.length) throw new TaskNotFoundException(input.taskId);
    const runs: TaskRunViewModel[] = await this.queryBus.execute(
      new TaskRunFindByTaskQuery({ taskId: input.taskId }),
    );
    return runs.map((r) => this.mapper.toRunResponseDto(r));
  }
}
