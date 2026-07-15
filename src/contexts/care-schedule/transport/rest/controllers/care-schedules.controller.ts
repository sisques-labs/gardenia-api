import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
  Filter,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CompleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.command';
import { CreateCareScheduleCommand } from '@contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.command';
import { DeleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.command';
import { UpdateCareScheduleCommand } from '@contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.command';
import { CareScheduleFindByCriteriaQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-criteria/care-schedule-find-by-criteria.query';
import { CareScheduleFindByIdQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-id/care-schedule-find-by-id.query';
import { WaterPlantCommand } from '@contexts/care-schedule/application/commands/water-plant/water-plant.command';
import { WaterPlantResult } from '@contexts/care-schedule/application/commands/water-plant/water-plant.result';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CompleteCareScheduleDto } from '../dtos/complete-care-schedule.dto';
import { CreateCareScheduleDto } from '../dtos/create-care-schedule.dto';
import { CareScheduleRestResponseDto } from '../dtos/care-schedule-rest-response.dto';
import { UpdateCareScheduleDto } from '../dtos/update-care-schedule.dto';
import { WaterPlantDto } from '../dtos/water-plant.dto';
import { WaterPlantRestResponseDto } from '../dtos/water-plant-rest-response.dto';
import { CareScheduleRestMapper } from '../mappers/care-schedule/care-schedule.mapper';

@ApiTags('care-schedules')
@ApiBearerAuth()
@Controller('care-schedules')
@UseGuards(JwtAuthGuard)
export class CareSchedulesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly careScheduleRestMapper: CareScheduleRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new care schedule' })
  @ApiResponse({ status: 201, type: CareScheduleRestResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing X-Space-ID',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCareSchedule(
    @Body() dto: CreateCareScheduleDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<CareScheduleRestResponseDto> {
    const careScheduleId = await this.commandBus.execute<
      CreateCareScheduleCommand,
      string
    >(
      new CreateCareScheduleCommand({
        plantId: dto.plantId,
        activityType: dto.activityType,
        intervalDays: dto.intervalDays,
        quantity: dto.quantity,
        unit: dto.unit,
        notes: dto.notes,
        nextDueAt: dto.nextDueAt,
        active: dto.active,
        userId: user.userId,
        spaceId,
      }),
    );

    const vm = await this.queryBus.execute<
      CareScheduleFindByIdQuery,
      CareScheduleViewModel
    >(new CareScheduleFindByIdQuery({ id: careScheduleId }));

    return this.careScheduleRestMapper.toResponse(vm);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List care schedules in the current space' })
  @ApiResponse({ status: 200 })
  async careSchedulesFindByCriteria(
    @Query('plantId') plantId?: string,
    @Query('activityType') activityType?: CareScheduleActivityTypeEnum,
    @Query('active') active?: string,
    @Query('dueBefore') dueBefore?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResult<CareScheduleRestResponseDto>> {
    const filters: Filter[] = [];
    if (plantId)
      filters.push({
        field: 'plant_id',
        operator: FilterOperator.EQUALS,
        value: plantId,
      });
    if (activityType)
      filters.push({
        field: 'activity_type',
        operator: FilterOperator.EQUALS,
        value: activityType,
      });
    if (active !== undefined)
      filters.push({
        field: 'active',
        operator: FilterOperator.EQUALS,
        value: active === 'true',
      });
    if (dueBefore)
      filters.push({
        field: 'due_before',
        operator: FilterOperator.LESS_THAN_OR_EQUAL,
        value: new Date(dueBefore),
      });

    const pagination =
      page || limit
        ? { page: page ? Number(page) : 1, perPage: limit ? Number(limit) : 20 }
        : undefined;

    const result = await this.queryBus.execute<
      CareScheduleFindByCriteriaQuery,
      PaginatedResult<CareScheduleViewModel>
    >(
      new CareScheduleFindByCriteriaQuery(
        new Criteria(filters, undefined, pagination),
      ),
    );

    return {
      items: result.items.map((vm) =>
        this.careScheduleRestMapper.toResponse(vm),
      ),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a care schedule by ID' })
  @ApiResponse({ status: 200, type: CareScheduleRestResponseDto })
  @ApiResponse({ status: 404, description: 'Care schedule not found' })
  async careScheduleFindById(
    @Param('id') id: string,
  ): Promise<CareScheduleRestResponseDto> {
    const vm = await this.queryBus.execute<
      CareScheduleFindByIdQuery,
      CareScheduleViewModel
    >(new CareScheduleFindByIdQuery({ id }));
    return this.careScheduleRestMapper.toResponse(vm);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a care schedule' })
  @ApiResponse({ status: 200, type: CareScheduleRestResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Care schedule not found' })
  async updateCareSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateCareScheduleDto,
  ): Promise<CareScheduleRestResponseDto> {
    await this.commandBus.execute(
      new UpdateCareScheduleCommand({
        id,
        activityType: dto.activityType,
        intervalDays: dto.intervalDays,
        quantity: dto.quantity,
        unit: dto.unit,
        notes: dto.notes,
        active: dto.active,
      }),
    );

    const vm = await this.queryBus.execute<
      CareScheduleFindByIdQuery,
      CareScheduleViewModel
    >(new CareScheduleFindByIdQuery({ id }));
    return this.careScheduleRestMapper.toResponse(vm);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a care schedule complete (advances next due)',
  })
  @ApiResponse({ status: 200, type: CareScheduleRestResponseDto })
  @ApiResponse({ status: 404, description: 'Care schedule not found' })
  async completeCareSchedule(
    @Param('id') id: string,
    @Body() dto: CompleteCareScheduleDto,
  ): Promise<CareScheduleRestResponseDto> {
    await this.commandBus.execute(
      new CompleteCareScheduleCommand({ id, completedAt: dto.completedAt }),
    );

    const vm = await this.queryBus.execute<
      CareScheduleFindByIdQuery,
      CareScheduleViewModel
    >(new CareScheduleFindByIdQuery({ id }));
    return this.careScheduleRestMapper.toResponse(vm);
  }

  @Post('water-plant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Water a single plant: completes its active WATERING care schedule, or records an ad-hoc care-log entry if it has none',
  })
  @ApiResponse({ status: 200, type: WaterPlantRestResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing X-Space-ID',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async waterPlant(
    @Body() dto: WaterPlantDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<WaterPlantRestResponseDto> {
    const result = await this.commandBus.execute<
      WaterPlantCommand,
      WaterPlantResult
    >(
      new WaterPlantCommand({
        plantId: dto.plantId,
        userId: user.userId,
        spaceId,
        performedAt: dto.performedAt,
      }),
    );

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a care schedule' })
  @ApiResponse({ status: 200, description: 'Care schedule deleted' })
  @ApiResponse({ status: 404, description: 'Care schedule not found' })
  async deleteCareSchedule(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteCareScheduleCommand({ id }));
    return { success: true };
  }
}
