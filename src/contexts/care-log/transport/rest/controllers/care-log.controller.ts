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
  FilterOperator,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';
import { DeleteCareLogEntryCommand } from '@contexts/care-log/application/commands/delete-care-log-entry/delete-care-log-entry.command';
import { UpdateCareLogEntryCommand } from '@contexts/care-log/application/commands/update-care-log-entry/update-care-log-entry.command';
import { CareLogFindByCriteriaQuery } from '@contexts/care-log/application/queries/care-log-find-by-criteria/care-log-find-by-criteria.query';
import { AssertCareLogEntryViewModelExistsService } from '@contexts/care-log/application/services/read/assert-care-log-entry-view-model-exists/assert-care-log-entry-view-model-exists.service';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { CareLogRestResponseDto } from '../dtos/care-log-rest-response.dto';
import { CreateCareLogEntryDto } from '../dtos/create-care-log-entry.dto';
import { UpdateCareLogEntryDto } from '../dtos/update-care-log-entry.dto';
import { CareLogRestMapper } from '../mappers/care-log/care-log.mapper';

@ApiTags('care-log')
@ApiBearerAuth()
@Controller('care-log')
@UseGuards(JwtAuthGuard)
export class CareLogController {
  private readonly logger = new Logger(CareLogController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly assertViewModelExists: AssertCareLogEntryViewModelExistsService,
    private readonly restMapper: CareLogRestMapper,
    private readonly spaceContext: SpaceContext,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a care log entry' })
  @ApiResponse({ status: 201, type: CareLogRestResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Quantity/unit mismatch' })
  async createCareLogEntry(
    @Body() dto: CreateCareLogEntryDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CareLogRestResponseDto> {
    this.logger.log(`Creating care log entry for plant: ${dto.plantId}`);

    const spaceId = this.spaceContext.require();
    const entryId = await this.commandBus.execute<
      CreateCareLogEntryCommand,
      string
    >(
      new CreateCareLogEntryCommand({
        plantId: dto.plantId,
        userId: user.userId,
        spaceId,
        activityType: dto.activityType,
        performedAt: dto.performedAt,
        notes: dto.notes,
        quantity: dto.quantity,
        unit: dto.unit,
      }),
    );

    const vm = await this.assertViewModelExists.execute(entryId);
    return this.restMapper.toResponse(vm);
  }

  @Get('plant/:plantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List care log entries for a plant' })
  @ApiResponse({ status: 200, type: [CareLogRestResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async careLogEntriesByPlant(
    @Param('plantId') plantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<CareLogRestResponseDto[]> {
    this.logger.log(`Listing care log entries for plant: ${plantId}`);

    const criteria = new Criteria(
      [{ field: 'plantId', operator: FilterOperator.EQUALS, value: plantId }],
      [{ field: 'performedAt', direction: SortDirection.DESC }],
      page != null
        ? { page: Number(page), perPage: Number(limit ?? 20) }
        : undefined,
    );

    const result = await this.queryBus.execute<
      CareLogFindByCriteriaQuery,
      PaginatedResult<CareLogEntryViewModel>
    >(new CareLogFindByCriteriaQuery({ criteria }));

    return result.items.map((vm) => this.restMapper.toResponse(vm));
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List care log entries for the current space' })
  @ApiResponse({ status: 200, type: [CareLogRestResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async careLogEntriesBySpace(
    @Query('activityTypes') activityTypes?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<CareLogRestResponseDto[]> {
    this.logger.log('Listing care log entries by space');

    const filters = [];
    if (activityTypes) {
      filters.push({
        field: 'activityType',
        operator: FilterOperator.IN,
        value: activityTypes.split(','),
      });
    }
    if (fromDate) {
      filters.push({
        field: 'performedAt',
        operator: FilterOperator.GREATER_THAN_OR_EQUAL,
        value: new Date(fromDate),
      });
    }
    if (toDate) {
      filters.push({
        field: 'performedAt',
        operator: FilterOperator.LESS_THAN_OR_EQUAL,
        value: new Date(toDate),
      });
    }

    const criteria = new Criteria(
      filters,
      [{ field: 'performedAt', direction: SortDirection.DESC }],
      page != null
        ? { page: Number(page), perPage: Number(limit ?? 20) }
        : undefined,
    );

    const result = await this.queryBus.execute<
      CareLogFindByCriteriaQuery,
      PaginatedResult<CareLogEntryViewModel>
    >(new CareLogFindByCriteriaQuery({ criteria }));

    return result.items.map((vm) => this.restMapper.toResponse(vm));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a care log entry by ID' })
  @ApiResponse({ status: 200, type: CareLogRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async careLogEntryFindById(
    @Param('id') id: string,
  ): Promise<CareLogRestResponseDto> {
    this.logger.log(`Finding care log entry: ${id}`);

    const vm = await this.assertViewModelExists.execute(id);
    return this.restMapper.toResponse(vm);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a care log entry' })
  @ApiResponse({ status: 200, type: CareLogRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the author' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateCareLogEntry(
    @Param('id') id: string,
    @Body() dto: UpdateCareLogEntryDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CareLogRestResponseDto> {
    this.logger.log(`Updating care log entry: ${id}`);

    await this.commandBus.execute(
      new UpdateCareLogEntryCommand({
        id,
        requestingUserId: user.userId,
        activityType: dto.activityType,
        performedAt: dto.performedAt,
        notes: dto.notes,
        quantity: dto.quantity,
        unit: dto.unit,
      }),
    );

    const vm = await this.assertViewModelExists.execute(id);
    return this.restMapper.toResponse(vm);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a care log entry' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the author' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteCareLogEntry(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    this.logger.log(`Deleting care log entry: ${id}`);

    await this.commandBus.execute(
      new DeleteCareLogEntryCommand({ id, requestingUserId: user.userId }),
    );
  }
}
