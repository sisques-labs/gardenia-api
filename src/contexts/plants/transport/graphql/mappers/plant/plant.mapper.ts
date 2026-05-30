import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import {
  PaginatedPlantResultDto,
  PlantResponseDto,
} from '../../dtos/responses/plant/plant.response.dto';

@Injectable()
export class PlantGraphQLMapper {
  private readonly logger = new Logger(PlantGraphQLMapper.name);

  toResponseDtoFromViewModel(vm: PlantViewModel): PlantResponseDto {
    this.logger.log(`Mapping plant view model to response dto: ${vm.id}`);

    return {
      id: vm.id,
      name: vm.name,
      species: vm.species,
      imageUrl: vm.imageUrl,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<PlantViewModel>,
  ): PaginatedPlantResultDto {
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
