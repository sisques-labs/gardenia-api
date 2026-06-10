import {
  Body,
  Controller,
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
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

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
import { UserTaskFindByDateQuery } from '@contexts/user-tasks/application/queries/user-task-find-by-date/user-task-find-by-date.query';
import { UserTaskFindByIdQuery } from '@contexts/user-tasks/application/queries/user-task-find-by-id/user-task-find-by-id.query';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';
import { CreateUserTaskRestDto } from '../dtos/create-user-task-rest.dto';
import { GenerateUserTasksFromTemplateRestDto } from '../dtos/generate-user-tasks-from-template-rest.dto';
import { RescheduleUserTaskRestDto } from '../dtos/reschedule-user-task-rest.dto';
import { UserTaskRestResponseDto } from '../dtos/user-task-rest-response.dto';
import { UserTaskRestMapper } from '../mappers/user-task-rest.mapper';

@ApiTags('user-tasks')
@ApiBearerAuth()
@Controller('user-tasks')
@UseGuards(JwtAuthGuard)
export class UserTasksController {
  private readonly logger = new Logger(UserTasksController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly mapper: UserTaskRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user task' })
  @ApiResponse({ status: 201, type: UserTaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createUserTask(
    @Body() dto: CreateUserTaskRestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskRestResponseDto> {
    this.logger.log(`POST /user-tasks title=${dto.title}`);

    const id = UuidValueObject.generate().value;
    await this.commandBus.execute(
      new CreateUserTaskCommand({
        id,
        title: dto.title,
        description: dto.description ?? null,
        scheduledDate: new Date(dto.scheduledDate),
        userId: user.userId,
        taskTemplateId: dto.taskTemplateId ?? null,
      }),
    );

    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(id));
    return this.mapper.toResponse(vm);
  }

  @Get('date/:date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find user tasks by scheduled date' })
  @ApiResponse({ status: 200, type: [UserTaskRestResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByDate(
    @Param('date') date: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskRestResponseDto[]> {
    this.logger.log(`GET /user-tasks/date/${date}`);
    const vms = await this.queryBus.execute<
      UserTaskFindByDateQuery,
      UserTaskViewModel[]
    >(new UserTaskFindByDateQuery(user.userId, new Date(date)));
    return vms.map((vm) => this.mapper.toResponse(vm));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user task by id' })
  @ApiResponse({ status: 200, type: UserTaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(@Param('id') id: string): Promise<UserTaskRestResponseDto> {
    this.logger.log(`GET /user-tasks/${id}`);
    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(id));
    return this.mapper.toResponse(vm);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a user task' })
  @ApiResponse({ status: 200, type: UserTaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({
    status: 422,
    description: 'Task not completable (future-dated or already terminal)',
  })
  async completeUserTask(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskRestResponseDto> {
    this.logger.log(`PATCH /user-tasks/${id}/complete`);
    await this.commandBus.execute(
      new CompleteUserTaskCommand({ id, userId: user.userId }),
    );
    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(id));
    return this.mapper.toResponse(vm);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a user task' })
  @ApiResponse({ status: 200, type: UserTaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async cancelUserTask(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskRestResponseDto> {
    this.logger.log(`PATCH /user-tasks/${id}/cancel`);
    await this.commandBus.execute(
      new CancelUserTaskCommand({ id, userId: user.userId }),
    );
    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(id));
    return this.mapper.toResponse(vm);
  }

  @Patch(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule a user task' })
  @ApiResponse({ status: 200, type: UserTaskRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async rescheduleUserTask(
    @Param('id') id: string,
    @Body() dto: RescheduleUserTaskRestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserTaskRestResponseDto> {
    this.logger.log(`PATCH /user-tasks/${id}/reschedule`);
    await this.commandBus.execute(
      new RescheduleUserTaskCommand({
        id,
        userId: user.userId,
        newScheduledDate: new Date(dto.newScheduledDate),
      }),
    );
    const vm = await this.queryBus.execute<
      UserTaskFindByIdQuery,
      UserTaskViewModel
    >(new UserTaskFindByIdQuery(id));
    return this.mapper.toResponse(vm);
  }

  @Post('generate-from-template')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate user tasks from a task template' })
  @ApiResponse({ status: 201, description: 'User tasks generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateFromTemplate(
    @Body() dto: GenerateUserTasksFromTemplateRestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ count: number }> {
    this.logger.log(
      `POST /user-tasks/generate-from-template templateId=${dto.taskTemplateId}`,
    );

    const scheduledDates = this.expandDates(
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.intervalDays ?? 1,
    );

    await this.commandBus.execute(
      new GenerateUserTasksFromTemplateCommand({
        taskTemplateId: dto.taskTemplateId,
        userId: user.userId,
        scheduledDates,
      }),
    );

    return { count: scheduledDates.length };
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
