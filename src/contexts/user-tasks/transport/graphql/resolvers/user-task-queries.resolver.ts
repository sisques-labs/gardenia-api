import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { UserTaskFindByDateQuery } from '@contexts/user-tasks/application/queries/user-task-find-by-date/user-task-find-by-date.query';
import { UserTaskFindByIdQuery } from '@contexts/user-tasks/application/queries/user-task-find-by-id/user-task-find-by-id.query';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';
import '@contexts/user-tasks/transport/graphql/enums/user-tasks-registered-enums.graphql';
import { UserTaskFindByDateGraphQLDto } from '../dtos/requests/user-task-find-by-date-graphql.dto';
import { UserTaskGraphQLResponseDto } from '../dtos/responses/user-task-graphql-response.dto';
import { UserTaskGraphQLMapper } from '../mappers/user-task-graphql.mapper';

@Resolver()
@UseGuards(JwtAuthGuard)
export class UserTaskQueriesResolver {
  private readonly logger = new Logger(UserTaskQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly mapper: UserTaskGraphQLMapper,
  ) {}

  @Query(() => UserTaskGraphQLResponseDto)
  async userTaskFindById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<UserTaskGraphQLResponseDto> {
    this.logger.log(`userTaskFindById id=${id}`);
    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(id));
    return this.mapper.toResponseDto(vm);
  }

  @Query(() => [UserTaskGraphQLResponseDto])
  async userTaskFindByDate(
    @Args('input') input: UserTaskFindByDateGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskGraphQLResponseDto[]> {
    this.logger.log(`userTaskFindByDate date=${input.date}`);
    const vms = await this.queryBus.execute<
      UserTaskFindByDateQuery,
      UserTaskViewModel[]
    >(new UserTaskFindByDateQuery(user.userId, new Date(input.date)));
    return vms.map((vm) => this.mapper.toResponseDto(vm));
  }
}
