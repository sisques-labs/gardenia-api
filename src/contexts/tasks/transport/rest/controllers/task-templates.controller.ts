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
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreateTaskTemplateCommand } from '@contexts/tasks/application/commands/create-task-template/create-task-template.command';
import { UpdateTaskTemplateCommand } from '@contexts/tasks/application/commands/update-task-template/update-task-template.command';
import { TaskTemplateFindByCriteriaQuery } from '@contexts/tasks/application/queries/task-template-find-by-criteria/task-template-find-by-criteria.query';
import { TaskTemplateFindByIdQuery } from '@contexts/tasks/application/queries/task-template-find-by-id/task-template-find-by-id.query';
import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';
import { CreateTaskTemplateRestDto } from '@contexts/tasks/transport/rest/dtos/create-task-template-rest.dto';
import { TaskTemplateRestResponseDto } from '@contexts/tasks/transport/rest/dtos/task-template-rest-response.dto';
import { UpdateTaskTemplateRestDto } from '@contexts/tasks/transport/rest/dtos/update-task-template-rest.dto';
import { TaskTemplateRestMapper } from '@contexts/tasks/transport/rest/mappers/task-template/task-template-rest.mapper';

@ApiTags('task-templates')
@ApiBearerAuth()
@Controller('task-templates')
@UseGuards(JwtAuthGuard)
export class TaskTemplatesController {
  private readonly logger = new Logger(TaskTemplatesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly mapper: TaskTemplateRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task template' })
  @ApiResponse({ status: 201, type: TaskTemplateRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTaskTemplate(
    @Body() dto: CreateTaskTemplateRestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskTemplateRestResponseDto> {
    this.logger.log(`POST /task-templates name=${dto.name}`);

    const id = await this.commandBus.execute<CreateTaskTemplateCommand, string>(
      new CreateTaskTemplateCommand({
        name: dto.name,
        description: dto.description,
        handlerKey: dto.handlerKey,
        defaultPriority: dto.defaultPriority,
        defaultRetryCount: dto.defaultRetryCount,
        defaultBackoffStrategy: dto.defaultBackoffStrategy,
        defaultTimeoutMs: dto.defaultTimeoutMs,
        maxConcurrency: dto.maxConcurrency,
        userId: user.userId,
      }),
    );

    const vm = await this.queryBus.execute<TaskTemplateFindByIdQuery, TaskTemplateViewModel>(
      new TaskTemplateFindByIdQuery({ id }),
    );
    return this.mapper.toResponse(vm);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a task template' })
  @ApiResponse({ status: 200, type: TaskTemplateRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateTaskTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTaskTemplateRestDto,
  ): Promise<TaskTemplateRestResponseDto> {
    this.logger.log(`PATCH /task-templates/${id}`);

    await this.commandBus.execute(
      new UpdateTaskTemplateCommand({ id, ...dto }),
    );

    const vm = await this.queryBus.execute<TaskTemplateFindByIdQuery, TaskTemplateViewModel>(
      new TaskTemplateFindByIdQuery({ id }),
    );
    return this.mapper.toResponse(vm);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a task template by id' })
  @ApiResponse({ status: 200, type: TaskTemplateRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getTaskTemplate(@Param('id') id: string): Promise<TaskTemplateRestResponseDto> {
    this.logger.log(`GET /task-templates/${id}`);
    const vm = await this.queryBus.execute<TaskTemplateFindByIdQuery, TaskTemplateViewModel>(
      new TaskTemplateFindByIdQuery({ id }),
    );
    return this.mapper.toResponse(vm);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List task templates' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTaskTemplates(): Promise<PaginatedResult<TaskTemplateRestResponseDto>> {
    this.logger.log('GET /task-templates');
    const result = await this.queryBus.execute<
      TaskTemplateFindByCriteriaQuery,
      PaginatedResult<TaskTemplateViewModel>
    >(new TaskTemplateFindByCriteriaQuery({ criteria: new Criteria() }));

    return {
      items: result.items.map((vm) => this.mapper.toResponse(vm)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }
}
