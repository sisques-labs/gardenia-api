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

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { DeletePlantSpeciesCommand } from '@contexts/plant-species/application/commands/delete-plant-species/delete-plant-species.command';
import { UpdatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/update-plant-species/update-plant-species.command';
import { PlantSpeciesFindByCriteriaQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-criteria/plant-species-find-by-criteria.query';
import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import { CreatePlantSpeciesDto } from '../dtos/create-plant-species.dto';
import { PlantSpeciesRestResponseDto } from '../dtos/plant-species-rest-response.dto';
import { UpdatePlantSpeciesDto } from '../dtos/update-plant-species.dto';
import { PlantSpeciesRestMapper } from '../mappers/plant-species/plant-species.mapper';

@ApiTags('plant-species')
@ApiBearerAuth()
@Controller('plant-species')
@SkipSpace()
@UseGuards(JwtAuthGuard)
export class PlantSpeciesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly plantSpeciesRestMapper: PlantSpeciesRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a plant species catalog entry' })
  @ApiResponse({
    status: 201,
    description: 'Plant species created successfully',
    type: PlantSpeciesRestResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async createPlantSpecies(
    @Body() dto: CreatePlantSpeciesDto,
  ): Promise<PlantSpeciesRestResponseDto> {
    const plantSpeciesId = await this.commandBus.execute<
      CreatePlantSpeciesCommand,
      string
    >(new CreatePlantSpeciesCommand({ name: dto.name }));

    const vm = await this.queryBus.execute<
      PlantSpeciesFindByIdQuery,
      PlantSpeciesViewModel
    >(new PlantSpeciesFindByIdQuery({ plantSpeciesId }));

    return this.plantSpeciesRestMapper.toResponse(vm);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all plant species catalog entries' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated plant species catalog entries',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listPlantSpecies(): Promise<
    PaginatedResult<PlantSpeciesRestResponseDto>
  > {
    const criteria = new Criteria(undefined, undefined, undefined);
    const result = await this.queryBus.execute<
      PlantSpeciesFindByCriteriaQuery,
      PaginatedResult<PlantSpeciesViewModel>
    >(new PlantSpeciesFindByCriteriaQuery({ criteria }));

    const items = result.items.map((vm) =>
      this.plantSpeciesRestMapper.toResponse(vm),
    );

    return new PaginatedResult(
      items,
      result.total,
      result.page,
      result.perPage,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a plant species catalog entry by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the plant species catalog entry',
    type: PlantSpeciesRestResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plant species not found' })
  async getPlantSpecies(
    @Param('id') id: string,
  ): Promise<PlantSpeciesRestResponseDto> {
    const vm = await this.queryBus.execute<
      PlantSpeciesFindByIdQuery,
      PlantSpeciesViewModel
    >(new PlantSpeciesFindByIdQuery({ plantSpeciesId: id }));

    return this.plantSpeciesRestMapper.toResponse(vm);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a plant species catalog entry' })
  @ApiResponse({
    status: 200,
    description: 'Plant species updated successfully',
    type: PlantSpeciesRestResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plant species not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async updatePlantSpecies(
    @Param('id') id: string,
    @Body() dto: UpdatePlantSpeciesDto,
  ): Promise<PlantSpeciesRestResponseDto> {
    await this.commandBus.execute(
      new UpdatePlantSpeciesCommand({ id, name: dto.name }),
    );

    const vm = await this.queryBus.execute<
      PlantSpeciesFindByIdQuery,
      PlantSpeciesViewModel
    >(new PlantSpeciesFindByIdQuery({ plantSpeciesId: id }));

    return this.plantSpeciesRestMapper.toResponse(vm);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plant species catalog entry' })
  @ApiResponse({
    status: 204,
    description: 'Plant species deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plant species not found' })
  @ApiResponse({ status: 409, description: 'Plant species is in use' })
  async deletePlantSpecies(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeletePlantSpeciesCommand({ id }));
  }
}
