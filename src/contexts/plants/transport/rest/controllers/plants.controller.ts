import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';
import { DeletePlantCommand } from '@contexts/plants/application/commands/delete-plant/delete-plant.command';
import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';
import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import { CreatePlantDto } from '../dtos/create-plant.dto';
import { PlantRestResponseDto } from '../dtos/plant-rest-response.dto';
import { UpdatePlantDto } from '../dtos/update-plant.dto';
import { PlantRestMapper } from '../mappers/plant/plant.mapper';

@ApiTags('plants')
@ApiBearerAuth()
@Controller('plants')
export class PlantsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly plantRestMapper: PlantRestMapper,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new plant' })
  @ApiResponse({
    status: 201,
    description: 'Plant created successfully',
    type: PlantRestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPlant(
    @Body() dto: CreatePlantDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PlantRestResponseDto> {
    const plantId = await this.commandBus.execute<CreatePlantCommand, string>(
      new CreatePlantCommand({
        name: dto.name,
        species: dto.species,
        imageUrl: dto.imageUrl,
        userId: user.userId,
      }),
    );
    const vm = await this.queryBus.execute<PlantFindByIdQuery, PlantViewModel>(
      new PlantFindByIdQuery({ plantId }),
    );
    return this.plantRestMapper.toResponse(vm);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all plants in the current space' })
  @ApiResponse({
    status: 200,
    description: 'Returns all plants in the space',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listPlants(): Promise<PaginatedResult<PlantRestResponseDto>> {
    const criteria = new Criteria(undefined, undefined, undefined);
    const result = await this.queryBus.execute<
      PlantFindByCriteriaQuery,
      PaginatedResult<PlantViewModel>
    >(new PlantFindByCriteriaQuery({ criteria }));

    const items = result.items.map((vm) => this.plantRestMapper.toResponse(vm));
    return new PaginatedResult(
      items,
      result.total,
      result.page,
      result.perPage,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a plant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the plant',
    type: PlantRestResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  async getPlant(@Param('id') id: string): Promise<PlantRestResponseDto> {
    const vm = await this.queryBus.execute<PlantFindByIdQuery, PlantViewModel>(
      new PlantFindByIdQuery({ plantId: id }),
    );
    return this.plantRestMapper.toResponse(vm);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a plant' })
  @ApiResponse({
    status: 200,
    description: 'Plant updated successfully',
    type: PlantRestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  async updatePlant(
    @Param('id') id: string,
    @Body() dto: UpdatePlantDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PlantRestResponseDto> {
    await this.commandBus.execute(
      new UpdatePlantCommand({
        plantId: id,
        name: dto.name,
        species: dto.species,
        imageUrl: dto.imageUrl,
        requestingUserId: user.userId,
      }),
    );
    const vm = await this.queryBus.execute<PlantFindByIdQuery, PlantViewModel>(
      new PlantFindByIdQuery({ plantId: id }),
    );
    return this.plantRestMapper.toResponse(vm);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plant' })
  @ApiResponse({ status: 204, description: 'Plant deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  async deletePlant(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeletePlantCommand({
        plantId: id,
        requestingUserId: user.userId,
      }),
    );
  }
}
