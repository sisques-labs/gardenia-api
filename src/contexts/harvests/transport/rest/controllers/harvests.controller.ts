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
import { CreateHarvestCommand } from '@contexts/harvests/application/commands/create-harvest/create-harvest.command';
import { DeleteHarvestCommand } from '@contexts/harvests/application/commands/delete-harvest/delete-harvest.command';
import { UpdateHarvestCommand } from '@contexts/harvests/application/commands/update-harvest/update-harvest.command';
import { HarvestFindByCriteriaQuery } from '@contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.query';
import { HarvestFindByIdQuery } from '@contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.query';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { CreateHarvestDto } from '../dtos/create-harvest.dto';
import { HarvestRestResponseDto } from '../dtos/harvest-rest-response.dto';
import { UpdateHarvestDto } from '../dtos/update-harvest.dto';
import { HarvestRestMapper } from '../mappers/harvest/harvest.mapper';

@ApiTags('harvests')
@ApiBearerAuth()
@Controller('harvests')
@UseGuards(JwtAuthGuard)
export class HarvestsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly harvestRestMapper: HarvestRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new harvest' })
  @ApiResponse({ status: 201, type: HarvestRestResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing X-Space-ID',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createHarvest(
    @Body() dto: CreateHarvestDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<HarvestRestResponseDto> {
    const harvestId = await this.commandBus.execute<
      CreateHarvestCommand,
      string
    >(
      new CreateHarvestCommand({
        cropType: dto.cropType,
        quantity: dto.quantity,
        unit: dto.unit,
        harvestedAt: dto.harvestedAt,
        userId: user.userId,
        spaceId,
      }),
    );

    const vm = await this.queryBus.execute<
      HarvestFindByIdQuery,
      HarvestViewModel
    >(new HarvestFindByIdQuery({ id: harvestId }));

    return this.harvestRestMapper.toResponse(vm);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List harvests in the current space' })
  @ApiResponse({ status: 200 })
  async harvestsFindByCriteria(
    @Query('cropType') cropType?: string,
    @Query('unit') unit?: HarvestUnitEnum,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResult<HarvestRestResponseDto>> {
    const filters: Filter[] = [];
    if (cropType)
      filters.push({
        field: 'crop_type',
        operator: FilterOperator.LIKE,
        value: cropType,
      });
    if (unit)
      filters.push({
        field: 'unit',
        operator: FilterOperator.EQUALS,
        value: unit,
      });
    if (dateFrom)
      filters.push({
        field: 'harvested_at',
        operator: FilterOperator.GREATER_THAN_OR_EQUAL,
        value: new Date(dateFrom),
      });
    if (dateTo)
      filters.push({
        field: 'harvested_at',
        operator: FilterOperator.LESS_THAN_OR_EQUAL,
        value: new Date(dateTo),
      });

    const pagination =
      page || limit
        ? { page: page ? Number(page) : 1, perPage: limit ? Number(limit) : 20 }
        : undefined;

    const result = await this.queryBus.execute<
      HarvestFindByCriteriaQuery,
      PaginatedResult<HarvestViewModel>
    >(
      new HarvestFindByCriteriaQuery(
        new Criteria(filters, undefined, pagination),
      ),
    );

    return {
      items: result.items.map((vm) => this.harvestRestMapper.toResponse(vm)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a harvest by ID' })
  @ApiResponse({ status: 200, type: HarvestRestResponseDto })
  @ApiResponse({ status: 404, description: 'Harvest not found' })
  async harvestFindById(
    @Param('id') id: string,
  ): Promise<HarvestRestResponseDto> {
    const vm = await this.queryBus.execute<
      HarvestFindByIdQuery,
      HarvestViewModel
    >(new HarvestFindByIdQuery({ id }));
    return this.harvestRestMapper.toResponse(vm);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a harvest' })
  @ApiResponse({ status: 200, type: HarvestRestResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Harvest not found' })
  async updateHarvest(
    @Param('id') id: string,
    @Body() dto: UpdateHarvestDto,
  ): Promise<HarvestRestResponseDto> {
    await this.commandBus.execute(
      new UpdateHarvestCommand({
        id,
        cropType: dto.cropType,
        quantity: dto.quantity,
        unit: dto.unit,
        harvestedAt: dto.harvestedAt,
      }),
    );

    const vm = await this.queryBus.execute<
      HarvestFindByIdQuery,
      HarvestViewModel
    >(new HarvestFindByIdQuery({ id }));
    return this.harvestRestMapper.toResponse(vm);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a harvest' })
  @ApiResponse({ status: 200, description: 'Harvest deleted successfully' })
  @ApiResponse({ status: 404, description: 'Harvest not found' })
  async deleteHarvest(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteHarvestCommand({ id }));
    return { success: true };
  }
}
