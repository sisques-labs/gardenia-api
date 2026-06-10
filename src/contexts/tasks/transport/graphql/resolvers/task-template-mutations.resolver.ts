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
import { CreateTaskTemplateCommand } from '@contexts/tasks/application/commands/create-task-template/create-task-template.command';
import { DeleteTaskTemplateCommand } from '@contexts/tasks/application/commands/delete-task-template/delete-task-template.command';
import { UpdateTaskTemplateCommand } from '@contexts/tasks/application/commands/update-task-template/update-task-template.command';
import { CreateTaskTemplateGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/create-task-template-graphql.dto';
import { UpdateTaskTemplateGraphQLDto } from '@contexts/tasks/transport/graphql/dtos/requests/update-task-template-graphql.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class TaskTemplateMutationsResolver {
  private readonly logger = new Logger(TaskTemplateMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async createTaskTemplate(
    @Args('input') input: CreateTaskTemplateGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating task template: ${input.name}`);

    const id = await this.commandBus.execute<CreateTaskTemplateCommand, string>(
      new CreateTaskTemplateCommand({
        name: input.name,
        description: input.description,
        handlerKey: input.handlerKey,
        defaultPriority: input.defaultPriority,
        defaultRetryCount: input.defaultRetryCount,
        defaultBackoffStrategy: input.defaultBackoffStrategy,
        defaultTimeoutMs: input.defaultTimeoutMs,
        maxConcurrency: input.maxConcurrency,
        defaultCronExpression: input.defaultCronExpression,
        defaultIsRecurring: input.defaultIsRecurring,
        userId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Task template created successfully',
      id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async deleteTaskTemplate(
    @Args('id') id: string,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting task template: ${id}`);

    await this.commandBus.execute(new DeleteTaskTemplateCommand({ id }));

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Task template deleted successfully',
      id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async updateTaskTemplate(
    @Args('input') input: UpdateTaskTemplateGraphQLDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating task template: ${input.id}`);

    await this.commandBus.execute(
      new UpdateTaskTemplateCommand({
        id: input.id,
        name: input.name,
        description: input.description,
        handlerKey: input.handlerKey,
        defaultPriority: input.defaultPriority,
        defaultRetryCount: input.defaultRetryCount,
        defaultBackoffStrategy: input.defaultBackoffStrategy,
        defaultTimeoutMs: input.defaultTimeoutMs,
        maxConcurrency: input.maxConcurrency,
        defaultCronExpression: input.defaultCronExpression,
        defaultIsRecurring: input.defaultIsRecurring,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Task template updated successfully',
      id: input.id,
    });
  }
}
