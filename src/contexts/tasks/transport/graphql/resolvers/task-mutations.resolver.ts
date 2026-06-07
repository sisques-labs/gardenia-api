import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { MutationResponseDto, MutationResponseGraphQLMapper } from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CancelTaskCommand } from '@contexts/tasks/application/commands/cancel-task/cancel-task.command';
import { ScheduleTaskCommand } from '@contexts/tasks/application/commands/schedule-task/schedule-task.command';
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
