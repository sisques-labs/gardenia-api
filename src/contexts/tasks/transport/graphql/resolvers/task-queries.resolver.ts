import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { TaskFindByCriteriaQuery } from '@contexts/tasks/application/queries/task-find-by-criteria/task-find-by-criteria.query';
import { TaskFindByIdQuery } from '@contexts/tasks/application/queries/task-find-by-id/task-find-by-id.query';
import { TaskRunFindByTaskQuery } from '@contexts/tasks/application/queries/task-run-find-by-task/task-run-find-by-task.query';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';
import { TaskFindByCriteriaGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/task-find-by-criteria-graphql.dto';
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
    @Args('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskGraphQLResponseDto> {
    this.logger.log(`Finding task by id: ${id}`);
    const result = await this.queryBus.execute(
      new TaskFindByIdQuery({ id, userId: user.userId }),
    );
    return this.mapper.toResponseDto(result);
  }

  @Query(() => PaginatedTaskResultDto)
  async taskFindByCriteria(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input', { nullable: true }) input?: TaskFindByCriteriaGraphQLDto,
  ): Promise<PaginatedTaskResultDto> {
    this.logger.log(`Finding tasks by criteria for user: ${user.userId}`);
    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );
    const result = await this.queryBus.execute(
      new TaskFindByCriteriaQuery({ criteria, userId: user.userId }),
    );
    return this.mapper.toPaginatedResponseDto(result);
  }

  @Query(() => [TaskRunGraphQLResponseDto])
  async taskRuns(
    @Args('taskId') taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskRunGraphQLResponseDto[]> {
    this.logger.log(`Finding task runs for task: ${taskId}`);
    await this.queryBus.execute(
      new TaskFindByIdQuery({ id: taskId, userId: user.userId }),
    );
    const runs: TaskRunViewModel[] = await this.queryBus.execute(
      new TaskRunFindByTaskQuery({ taskId }),
    );
    return runs.map((r) => this.mapper.toRunResponseDto(r));
  }
}
