import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import {
  PaginatedPlantingSpotResultDto,
  PlantingSpotResponseDto,
} from '@contexts/planting-spots/transport/graphql/dtos/responses/planting-spot.response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

@Injectable()
export class PlantingSpotGraphQLMapper {
  private readonly logger = new Logger(PlantingSpotGraphQLMapper.name);

  toResponseDtoFromViewModel(
    vm: PlantingSpotViewModel,
    resolvedPlants?: PlantingSpotPlantViewModel[],
  ): PlantingSpotResponseDto {
    this.logger.log(`Mapping planting spot view model to response dto: ${vm.id}`);

    const hasDimensions =
      vm.dimensionsWidth != null ||
      vm.dimensionsHeight != null ||
      vm.dimensionsLength != null;

    return {
      id: vm.id,
      name: vm.name,
      type: vm.type as PlantingSpotTypeEnum,
      description: vm.description,
      capacity: vm.capacity,
      row: vm.row,
      column: vm.column,
      dimensions: hasDimensions
        ? { width: vm.dimensionsWidth, height: vm.dimensionsHeight, length: vm.dimensionsLength }
        : null,
      soilType: vm.soilType,
      userId: vm.userId,
      spaceId: vm.spaceId,
      resolvedPlants: (resolvedPlants ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        plantSpeciesId: p.plantSpeciesId,
        imageUrl: p.imageUrl,
        userId: p.userId,
        spaceId: p.spaceId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<PlantingSpotViewModel>,
    resolvedPlantsMap?: Map<string, PlantingSpotPlantViewModel[]>,
  ): PaginatedPlantingSpotResultDto {
    return {
      items: paginatedResult.items.map((vm) =>
        this.toResponseDtoFromViewModel(vm, resolvedPlantsMap?.get(vm.id)),
      ),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
