import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CancelTaskCommand } from '@contexts/tasks/application/commands/cancel-task/cancel-task.command';
import { ScheduleTaskCommand } from '@contexts/tasks/application/commands/schedule-task/schedule-task.command';
import { TaskFindByCriteriaQuery } from '@contexts/tasks/application/queries/task-find-by-criteria/task-find-by-criteria.query';
import { TaskFindByIdQuery } from '@contexts/tasks/application/queries/task-find-by-id/task-find-by-id.query';
import { TaskRunFindByTaskQuery } from '@contexts/tasks/application/queries/task-run-find-by-task/task-run-find-by-task.query';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';
import { ScheduleTaskRestDto } from '@contexts/tasks/transport/rest/dtos/schedule-task-rest.dto';
import { TaskRestResponseDto } from '@contexts/tasks/transport/rest/dtos/task-rest-response.dto';
import { TaskRestMapper } from '@contexts/tasks/transport/rest/mappers/task/task-rest.mapper';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly mapper: TaskRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a task' })
  @ApiResponse({ status: 201, type: TaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  async scheduleTask(
    @Body() dto: ScheduleTaskRestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskRestResponseDto> {
    this.logger.log(`POST /tasks templateId=${dto.templateId}`);

    const taskId = await this.commandBus.execute<ScheduleTaskCommand, string>(
      new ScheduleTaskCommand({
        templateId: dto.templateId,
        payload: dto.payload,
        priority: dto.priority,
        delayMs: dto.delayMs,
        cronExpression: dto.cronExpression,
        isRecurring: dto.isRecurring,
        maxRuns: dto.maxRuns,
        idempotencyKey: dto.idempotencyKey,
        userId: user.userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      }),
    );

    const vm = await this.queryBus.execute<TaskFindByIdQuery, TaskViewModel>(
      new TaskFindByIdQuery({ id: taskId, userId: user.userId }),
    );
    return this.mapper.toResponse(vm);
  }

  @Delete(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending task' })
  @ApiResponse({ status: 200, description: 'Task cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 409, description: 'Task not cancellable' })
  async cancelTask(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    this.logger.log(`DELETE /tasks/${id}/cancel`);
    await this.commandBus.execute(new CancelTaskCommand({ id, userId: user.userId }));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiResponse({ status: 200, type: TaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTask(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskRestResponseDto> {
    this.logger.log(`GET /tasks/${id}`);
    const vm = await this.queryBus.execute<TaskFindByIdQuery, TaskViewModel>(
      new TaskFindByIdQuery({ id, userId: user.userId }),
    );
    return this.mapper.toResponse(vm);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List tasks for the current user' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTasks(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PaginatedResult<TaskRestResponseDto>> {
    this.logger.log(`GET /tasks userId=${user.userId}`);
    const result = await this.queryBus.execute<
      TaskFindByCriteriaQuery,
      PaginatedResult<TaskViewModel>
    >(new TaskFindByCriteriaQuery({ criteria: new Criteria(), userId: user.userId }));

    return {
      items: result.items.map((vm) => this.mapper.toResponse(vm)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get(':id/runs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get execution history for a task' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskRuns(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskRunViewModel[]> {
    this.logger.log(`GET /tasks/${id}/runs`);
    await this.queryBus.execute(new TaskFindByIdQuery({ id, userId: user.userId }));
    return this.queryBus.execute(new TaskRunFindByTaskQuery({ taskId: id }));
  }
}
