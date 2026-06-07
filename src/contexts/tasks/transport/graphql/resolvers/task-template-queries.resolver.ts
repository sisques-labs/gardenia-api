import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { TaskTemplateFindByCriteriaQuery } from '@contexts/tasks/application/queries/task-template-find-by-criteria/task-template-find-by-criteria.query';
import { TaskTemplateFindByIdQuery } from '@contexts/tasks/application/queries/task-template-find-by-id/task-template-find-by-id.query';
import { TaskTemplateFindByCriteriaGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/task-template-find-by-criteria-graphql.dto';
import {
  PaginatedTaskTemplateResultDto,
  TaskTemplateGraphQLResponseDto,
} from '@contexts/tasks/transport/graphql/dtos/responses/task-template-graphql-response.dto';
import '@contexts/tasks/transport/graphql/enums/tasks-registered-enums.graphql';
import { TaskTemplateGraphQLMapper } from '@contexts/tasks/transport/graphql/mappers/task-template-graphql.mapper';

@Resolver()
@UseGuards(JwtAuthGuard)
export class TaskTemplateQueriesResolver {
  private readonly logger = new Logger(TaskTemplateQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly mapper: TaskTemplateGraphQLMapper,
  ) {}

  @Query(() => TaskTemplateGraphQLResponseDto)
  async taskTemplateFindById(
    @Args('id') id: string,
  ): Promise<TaskTemplateGraphQLResponseDto> {
    this.logger.log(`Finding task template by id: ${id}`);
    const result = await this.queryBus.execute(
      new TaskTemplateFindByIdQuery({ id }),
    );
    return this.mapper.toResponseDto(result);
  }

  @Query(() => PaginatedTaskTemplateResultDto)
  async taskTemplateFindByCriteria(
    @Args('input', { nullable: true })
    input?: TaskTemplateFindByCriteriaGraphQLDto,
  ): Promise<PaginatedTaskTemplateResultDto> {
    this.logger.log('Finding task templates by criteria');
    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );
    const result = await this.queryBus.execute(
      new TaskTemplateFindByCriteriaQuery({ criteria }),
    );
    return this.mapper.toPaginatedResponseDto(result);
  }
}
