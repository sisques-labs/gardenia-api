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
import { CreatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command';
import { DeletePlantingSpotCommand } from '@contexts/planting-spots/application/commands/delete-planting-spot/delete-planting-spot.command';
import { MarkPlantingSpotActiveCommand } from '@contexts/planting-spots/application/commands/mark-planting-spot-active/mark-planting-spot-active.command';
import { MarkPlantingSpotFallowCommand } from '@contexts/planting-spots/application/commands/mark-planting-spot-fallow/mark-planting-spot-fallow.command';
import { UpdatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.command';
import { PlantingSpotFindByCriteriaQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query';
import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { WaterPlantingSpotCommand } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.command';
import { WaterPlantingSpotResult } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.result';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';

import { CreatePlantingSpotDto } from '../dtos/create-planting-spot.dto';
import { PlantingSpotRestResponseDto } from '../dtos/planting-spot-rest-response.dto';
import { UpdatePlantingSpotDto } from '../dtos/update-planting-spot.dto';
import { WaterPlantingSpotDto } from '../dtos/water-planting-spot.dto';
import { WaterPlantingSpotRestResponseDto } from '../dtos/water-planting-spot-rest-response.dto';
import { PlantingSpotRestMapper } from '../mappers/planting-spot/planting-spot.mapper';

@ApiTags('planting-spots')
@ApiBearerAuth()
@Controller('planting-spots')
@UseGuards(JwtAuthGuard)
export class PlantingSpotsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly plantingSpotRestMapper: PlantingSpotRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new planting spot' })
  @ApiResponse({
    status: 201,
    description: 'Planting spot created successfully',
    type: PlantingSpotRestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing X-Space-ID',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPlantingSpot(
    @Body() dto: CreatePlantingSpotDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<PlantingSpotRestResponseDto> {
    const spotId = await this.commandBus.execute<
      CreatePlantingSpotCommand,
      string
    >(
      new CreatePlantingSpotCommand({
        name: dto.name,
        type: dto.type,
        description: dto.description ?? null,
        capacity: dto.capacity ?? null,
        row: dto.row ?? null,
        column: dto.column ?? null,
        dimensionsWidth: dto.dimensions?.width ?? null,
        dimensionsHeight: dto.dimensions?.height ?? null,
        dimensionsLength: dto.dimensions?.length ?? null,
        soilType: dto.soilType ?? null,
        userId: user.userId,
        spaceId,
      }),
    );

    const vm = await this.queryBus.execute<
      PlantingSpotFindByIdQuery,
      PlantingSpotViewModel
    >(new PlantingSpotFindByIdQuery({ id: spotId }));

    return this.plantingSpotRestMapper.toResponse(vm);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all planting spots in the current space' })
  @ApiResponse({
    status: 200,
    description: 'Returns all planting spots in the space',
  })
  @ApiResponse({ status: 400, description: 'Missing X-Space-ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async plantingSpotsFindByCriteria(): Promise<
    PaginatedResult<PlantingSpotRestResponseDto>
  > {
    const result = await this.queryBus.execute<
      PlantingSpotFindByCriteriaQuery,
      PaginatedResult<PlantingSpotViewModel>
    >(
      new PlantingSpotFindByCriteriaQuery({
        criteria: new Criteria(undefined, undefined, undefined),
      }),
    );

    const items = result.items.map((vm) =>
      this.plantingSpotRestMapper.toResponse(vm),
    );

    return {
      items,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a planting spot by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the planting spot',
    type: PlantingSpotRestResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Planting spot not found' })
  async plantingSpotFindById(
    @Param('id') id: string,
    @Headers('x-space-id') _spaceId: string,
  ): Promise<PlantingSpotRestResponseDto> {
    const vm = await this.queryBus.execute<
      PlantingSpotFindByIdQuery,
      PlantingSpotViewModel
    >(new PlantingSpotFindByIdQuery({ id }));

    return this.plantingSpotRestMapper.toResponse(vm);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a planting spot' })
  @ApiResponse({
    status: 200,
    description: 'Planting spot updated successfully',
    type: PlantingSpotRestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Planting spot not found' })
  async updatePlantingSpot(
    @Param('id') id: string,
    @Body() dto: UpdatePlantingSpotDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<PlantingSpotRestResponseDto> {
    await this.commandBus.execute(
      new UpdatePlantingSpotCommand({
        id,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        capacity: dto.capacity,
        row: dto.row,
        column: dto.column,
        dimensionsWidth:
          dto.dimensions !== undefined
            ? (dto.dimensions?.width ?? null)
            : undefined,
        dimensionsHeight:
          dto.dimensions !== undefined
            ? (dto.dimensions?.height ?? null)
            : undefined,
        dimensionsLength:
          dto.dimensions !== undefined
            ? (dto.dimensions?.length ?? null)
            : undefined,
        soilType: dto.soilType,
        requestingUserId: user.userId,
        spaceId,
      }),
    );

    const vm = await this.queryBus.execute<
      PlantingSpotFindByIdQuery,
      PlantingSpotViewModel
    >(new PlantingSpotFindByIdQuery({ id }));

    return this.plantingSpotRestMapper.toResponse(vm);
  }

  @Post(':id/water')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Water every plant in a planting spot (hybrid mechanism, best-effort)',
  })
  @ApiResponse({ status: 200, type: WaterPlantingSpotRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Planting spot not found' })
  async waterPlantingSpot(
    @Param('id') id: string,
    @Body() dto: WaterPlantingSpotDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<WaterPlantingSpotRestResponseDto> {
    const result = await this.commandBus.execute<
      WaterPlantingSpotCommand,
      WaterPlantingSpotResult
    >(
      new WaterPlantingSpotCommand({
        id,
        userId: user.userId,
        spaceId,
        performedAt: dto.performedAt,
      }),
    );

    return result;
  }

  @Post(':id/mark-fallow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a planting spot as fallow (resting)' })
  @ApiResponse({
    status: 200,
    description: 'Planting spot marked fallow successfully',
    type: PlantingSpotRestResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Planting spot not found' })
  async markPlantingSpotFallow(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<PlantingSpotRestResponseDto> {
    await this.commandBus.execute(
      new MarkPlantingSpotFallowCommand({
        id,
        requestingUserId: user.userId,
        spaceId,
      }),
    );

    const vm = await this.queryBus.execute<
      PlantingSpotFindByIdQuery,
      PlantingSpotViewModel
    >(new PlantingSpotFindByIdQuery({ id }));

    return this.plantingSpotRestMapper.toResponse(vm);
  }

  @Post(':id/mark-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a planting spot as active (reactivate)' })
  @ApiResponse({
    status: 200,
    description: 'Planting spot marked active successfully',
    type: PlantingSpotRestResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Planting spot not found' })
  async markPlantingSpotActive(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<PlantingSpotRestResponseDto> {
    await this.commandBus.execute(
      new MarkPlantingSpotActiveCommand({
        id,
        requestingUserId: user.userId,
        spaceId,
      }),
    );

    const vm = await this.queryBus.execute<
      PlantingSpotFindByIdQuery,
      PlantingSpotViewModel
    >(new PlantingSpotFindByIdQuery({ id }));

    return this.plantingSpotRestMapper.toResponse(vm);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a planting spot' })
  @ApiResponse({
    status: 204,
    description: 'Planting spot deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Planting spot not found' })
  @ApiResponse({ status: 409, description: 'Planting spot is in use' })
  async deletePlantingSpot(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeletePlantingSpotCommand({
        id: id,
        requestingUserId: user.userId,
        spaceId,
      }),
    );
  }
}
