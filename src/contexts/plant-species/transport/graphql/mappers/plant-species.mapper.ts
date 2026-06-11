import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

import {
  PaginatedPlantSpeciesResultDto,
  PlantSpeciesResponseDto,
} from '@contexts/plant-species/transport/graphql/dtos/responses/plant-species.response.dto';

@Injectable()
export class PlantSpeciesGraphQLMapper {
  private readonly logger = new Logger(PlantSpeciesGraphQLMapper.name);

  toResponseDtoFromViewModel(
    vm: PlantSpeciesViewModel,
  ): PlantSpeciesResponseDto {
    this.logger.log(
      `Mapping plant species view model to response dto: ${vm.id}`,
    );

    return {
      id: vm.id,
      scientificName: vm.scientificName,
      description: vm.description,
      imageUrl: vm.imageUrl,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<PlantSpeciesViewModel>,
  ): PaginatedPlantSpeciesResultDto {
    return {
      items: paginatedResult.items.map((vm) =>
        this.toResponseDtoFromViewModel(vm),
      ),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
