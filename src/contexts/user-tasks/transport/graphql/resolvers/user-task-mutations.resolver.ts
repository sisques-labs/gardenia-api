import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CancelUserTaskCommand } from '@contexts/user-tasks/application/commands/cancel-user-task/cancel-user-task.command';
import { CompleteUserTaskCommand } from '@contexts/user-tasks/application/commands/complete-user-task/complete-user-task.command';
import { CreateUserTaskCommand } from '@contexts/user-tasks/application/commands/create-user-task/create-user-task.command';
import { GenerateUserTasksFromTemplateCommand } from '@contexts/user-tasks/application/commands/generate-user-tasks-from-template/generate-user-tasks-from-template.command';
import { RescheduleUserTaskCommand } from '@contexts/user-tasks/application/commands/reschedule-user-task/reschedule-user-task.command';
import { UserTaskFindByIdQuery } from '@contexts/user-tasks/application/queries/user-task-find-by-id/user-task-find-by-id.query';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';
import '@contexts/user-tasks/transport/graphql/enums/user-tasks-registered-enums.graphql';
import { UserTaskGraphQLResponseDto } from '../dtos/responses/user-task-graphql-response.dto';
import { CancelUserTaskGraphQLDto } from '../dtos/requests/cancel-user-task-graphql.dto';
import { CompleteUserTaskGraphQLDto } from '../dtos/requests/complete-user-task-graphql.dto';
import { CreateUserTaskGraphQLDto } from '../dtos/requests/create-user-task-graphql.dto';
import { GenerateUserTasksFromTemplateGraphQLDto } from '../dtos/requests/generate-user-tasks-from-template-graphql.dto';
import { RescheduleUserTaskGraphQLDto } from '../dtos/requests/reschedule-user-task-graphql.dto';
import { UserTaskGraphQLMapper } from '../mappers/user-task-graphql.mapper';

@Resolver()
@UseGuards(JwtAuthGuard)
export class UserTaskMutationsResolver {
  private readonly logger = new Logger(UserTaskMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly mapper: UserTaskGraphQLMapper,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => UserTaskGraphQLResponseDto)
  async createUserTask(
    @Args('input') input: CreateUserTaskGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskGraphQLResponseDto> {
    this.logger.log(`createUserTask title=${input.title}`);

    const id = UuidValueObject.generate().value;
    await this.commandBus.execute(
      new CreateUserTaskCommand({
        id,
        title: input.title,
        description: input.description ?? null,
        scheduledDate: new Date(input.scheduledDate),
        userId: user.userId,
        taskTemplateId: input.taskTemplateId ?? null,
      }),
    );

    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(id));
    return this.mapper.toResponseDto(vm);
  }

  @Mutation(() => UserTaskGraphQLResponseDto)
  async completeUserTask(
    @Args('input') input: CompleteUserTaskGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskGraphQLResponseDto> {
    this.logger.log(`completeUserTask id=${input.id}`);

    await this.commandBus.execute(
      new CompleteUserTaskCommand({ id: input.id, userId: user.userId }),
    );

    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(input.id));
    return this.mapper.toResponseDto(vm);
  }

  @Mutation(() => MutationResponseDto)
  async cancelUserTask(
    @Args('input') input: CancelUserTaskGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`cancelUserTask id=${input.id}`);

    await this.commandBus.execute(
      new CancelUserTaskCommand({ id: input.id, userId: user.userId }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'User task cancelled successfully',
      id: input.id,
    });
  }

  @Mutation(() => UserTaskGraphQLResponseDto)
  async rescheduleUserTask(
    @Args('input') input: RescheduleUserTaskGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskGraphQLResponseDto> {
    this.logger.log(`rescheduleUserTask id=${input.id}`);

    await this.commandBus.execute(
      new RescheduleUserTaskCommand({
        id: input.id,
        userId: user.userId,
        newScheduledDate: new Date(input.newScheduledDate),
      }),
    );

    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(input.id));
    return this.mapper.toResponseDto(vm);
  }

  @Mutation(() => MutationResponseDto)
  async generateUserTasksFromTemplate(
    @Args('input') input: GenerateUserTasksFromTemplateGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(
      `generateUserTasksFromTemplate templateId=${input.taskTemplateId}`,
    );

    const scheduledDates = this.expandDates(
      new Date(input.startDate),
      new Date(input.endDate),
      input.intervalDays ?? 1,
    );

    await this.commandBus.execute(
      new GenerateUserTasksFromTemplateCommand({
        taskTemplateId: input.taskTemplateId,
        userId: user.userId,
        scheduledDates,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: `Generated ${scheduledDates.length} user tasks from template`,
      id: input.taskTemplateId,
    });
  }

  private expandDates(start: Date, end: Date, intervalDays: number): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    current.setUTCHours(0, 0, 0, 0);
    const endNormalized = new Date(end);
    endNormalized.setUTCHours(0, 0, 0, 0);

    while (current <= endNormalized) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + intervalDays);
    }
    return dates;
  }
}
