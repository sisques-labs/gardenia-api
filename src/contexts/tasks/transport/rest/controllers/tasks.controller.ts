import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
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
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
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
import { TaskFindByCriteriaQuery } from '@contexts/tasks/application/queries/task-find-by-criteria/task-find-by-criteria.query';
import { TaskFindByIdQuery } from '@contexts/tasks/application/queries/task-find-by-id/task-find-by-id.query';
import { TaskRunFindByTaskQuery } from '@contexts/tasks/application/queries/task-run-find-by-task/task-run-find-by-task.query';
import { TaskNotFoundException } from '@contexts/tasks/domain/exceptions/task-not-found.exception';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';
import { CreateTaskRestDto } from '@contexts/tasks/transport/rest/dtos/create-task-rest.dto';
import { RescheduleTaskRestDto } from '@contexts/tasks/transport/rest/dtos/reschedule-task-rest.dto';
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
      new TaskFindByIdQuery({ id: taskId }),
    );
    return this.mapper.toResponse(vm);
  }

  @Post('adhoc')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an ad-hoc user task' })
  @ApiResponse({ status: 201, type: TaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTask(
    @Body() dto: CreateTaskRestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskRestResponseDto> {
    this.logger.log(`POST /tasks/adhoc title=${dto.title}`);

    const taskId = await this.commandBus.execute<CreateTaskCommand, string>(
      new CreateTaskCommand({
        title: dto.title,
        description: dto.description ?? null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        userId: user.userId,
      }),
    );

    const vm = await this.queryBus.execute<TaskFindByIdQuery, TaskViewModel>(
      new TaskFindByIdQuery({ id: taskId }),
    );
    return this.mapper.toResponse(vm);
  }

  @Patch(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule a user task' })
  @ApiResponse({ status: 200, type: TaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 409, description: 'Task not reschedulable' })
  async rescheduleTask(
    @Param('id') id: string,
    @Body() dto: RescheduleTaskRestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskRestResponseDto> {
    this.logger.log(`PATCH /tasks/${id}/reschedule`);

    await this.commandBus.execute(
      new RescheduleTaskCommand({
        id,
        scheduledAt: new Date(dto.scheduledAt),
        userId: user.userId,
      }),
    );

    const vm = await this.queryBus.execute<TaskFindByIdQuery, TaskViewModel>(
      new TaskFindByIdQuery({ id }),
    );
    return this.mapper.toResponse(vm);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a user task' })
  @ApiResponse({ status: 200, type: TaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 409, description: 'Task not completable' })
  async completeUserTask(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskRestResponseDto> {
    this.logger.log(`POST /tasks/${id}/complete`);

    await this.commandBus.execute(
      new CompleteUserTaskCommand({ id, userId: user.userId }),
    );

    const vm = await this.queryBus.execute<TaskFindByIdQuery, TaskViewModel>(
      new TaskFindByIdQuery({ id }),
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
    await this.commandBus.execute(
      new CancelTaskCommand({ id, userId: user.userId }),
    );
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
    const result = await this.queryBus.execute<
      TaskFindByCriteriaQuery,
      PaginatedResult<TaskViewModel>
    >(
      new TaskFindByCriteriaQuery({
        criteria: new Criteria([
          { field: 'id', operator: FilterOperator.EQUALS, value: id },
          {
            field: 'userId',
            operator: FilterOperator.EQUALS,
            value: user.userId,
          },
        ]),
      }),
    );
    if (!result.items.length) throw new TaskNotFoundException(id);
    return this.mapper.toResponse(result.items[0]);
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
    >(
      new TaskFindByCriteriaQuery({
        criteria: new Criteria([
          {
            field: 'userId',
            operator: FilterOperator.EQUALS,
            value: user.userId,
          },
        ]),
      }),
    );

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
    const ownership = await this.queryBus.execute<
      TaskFindByCriteriaQuery,
      PaginatedResult<TaskViewModel>
    >(
      new TaskFindByCriteriaQuery({
        criteria: new Criteria([
          { field: 'id', operator: FilterOperator.EQUALS, value: id },
          {
            field: 'userId',
            operator: FilterOperator.EQUALS,
            value: user.userId,
          },
        ]),
      }),
    );
    if (!ownership.items.length) throw new TaskNotFoundException(id);
    return this.queryBus.execute(new TaskRunFindByTaskQuery({ taskId: id }));
  }
}
