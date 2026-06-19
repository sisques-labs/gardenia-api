import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import {
  PaginatedPlantingSpotResultDto,
  PlantInSpotResponseDto,
  PlantingSpotResponseDto,
} from '@contexts/planting-spots/transport/graphql/dtos/responses/planting-spot.response.dto';

@Injectable()
export class PlantingSpotGraphQLMapper {
  private readonly logger = new Logger(PlantingSpotGraphQLMapper.name);

  toResponseDtoFromViewModel(vm: PlantingSpotViewModel): PlantingSpotResponseDto {
    this.logger.log(`Mapping planting spot view model to response dto: ${vm.id}`);

    return {
      id: vm.id,
      name: vm.name,
      type: vm.type as PlantingSpotTypeEnum,
      description: vm.description,
      capacity: vm.capacity,
      row: vm.row,
      column: vm.column,
      dimensionsWidth: vm.dimensionsWidth,
      dimensionsHeight: vm.dimensionsHeight,
      dimensionsLength: vm.dimensionsLength,
      soilType: vm.soilType,
      userId: vm.userId,
      spaceId: vm.spaceId,
      resolvedPlants: [],
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPlantInSpotResponseDto(p: PlantingSpotPlantViewModel): PlantInSpotResponseDto {
    return {
      id: p.id,
      name: p.name,
      plantSpeciesId: p.plantSpeciesId,
      imageUrl: p.imageUrl,
      userId: p.userId,
      spaceId: p.spaceId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<PlantingSpotViewModel>,
  ): PaginatedPlantingSpotResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDtoFromViewModel(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
