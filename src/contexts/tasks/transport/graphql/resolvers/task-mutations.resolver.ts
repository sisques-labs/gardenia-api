import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CancelTaskCommand } from '@contexts/tasks/application/commands/cancel-task/cancel-task.command';
import { CompleteUserTaskCommand } from '@contexts/tasks/application/commands/complete-user-task/complete-user-task.command';
import { CreateTaskCommand } from '@contexts/tasks/application/commands/create-task/create-task.command';
import { RescheduleTaskCommand } from '@contexts/tasks/application/commands/reschedule-task/reschedule-task.command';
import { ScheduleTaskCommand } from '@contexts/tasks/application/commands/schedule-task/schedule-task.command';
import { CreateTaskGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/create-task-graphql.dto';
import { RescheduleTaskGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/reschedule-task-graphql.dto';
import { ScheduleTaskGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/schedule-task-graphql.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class TaskMutationsResolver {
  private readonly logger = new Logger(TaskMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async scheduleTask(
    @Args('input') input: ScheduleTaskGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Scheduling task for template: ${input.templateId}`);

    const taskId = await this.commandBus.execute<ScheduleTaskCommand, string>(
      new ScheduleTaskCommand({
        templateId: input.templateId,
        payload: input.payload ? JSON.parse(input.payload) : {},
        priority: input.priority,
        delayMs: input.delayMs,
        cronExpression: input.cronExpression,
        isRecurring: input.isRecurring,
        maxRuns: input.maxRuns,
        idempotencyKey: input.idempotencyKey,
        userId: user.userId,
        targetType: input.targetType,
        targetId: input.targetId,
        validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
        validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Task scheduled successfully',
      id: taskId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async createTask(
    @Args('input') input: CreateTaskGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating ad-hoc task: ${input.title}`);

    const taskId = await this.commandBus.execute<CreateTaskCommand, string>(
      new CreateTaskCommand({
        title: input.title,
        description: input.description ?? null,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        userId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Task created successfully',
      id: taskId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async rescheduleTask(
    @Args('input') input: RescheduleTaskGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Rescheduling task: ${input.id}`);

    await this.commandBus.execute(
      new RescheduleTaskCommand({
        id: input.id,
        scheduledAt: new Date(input.scheduledAt),
        userId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Task rescheduled successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async completeUserTask(
    @Args('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Completing user task: ${id}`);

    await this.commandBus.execute(
      new CompleteUserTaskCommand({ id, userId: user.userId }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Task completed successfully',
      id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async cancelTask(
    @Args('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Cancelling task: ${id}`);

    await this.commandBus.execute(
      new CancelTaskCommand({ id, userId: user.userId }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Task cancelled successfully',
      id,
    });
  }
}
