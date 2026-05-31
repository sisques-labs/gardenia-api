import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import {
  PaginatedPlantResultDto,
  PlantResponseDto,
  PlantLinkedSpeciesResponseDto,
} from '../../dtos/responses/plant/plant.response.dto';

@Injectable()
export class PlantGraphQLMapper {
  private readonly logger = new Logger(PlantGraphQLMapper.name);

  toResponseDtoFromViewModel(vm: PlantViewModel): PlantResponseDto {
    this.logger.log(`Mapping plant view model to response dto: ${vm.id}`);

    return {
      id: vm.id,
      name: vm.name,
      plantSpeciesId: vm.plantSpeciesId,
      species: vm.species ? this.toSpeciesResponse(vm.species) : null,
      imageUrl: vm.imageUrl,
      userId: vm.userId,
      spaceId: vm.spaceId,
      qr: vm.qr ?? null,
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

  private toSpeciesResponse(
    species: NonNullable<PlantViewModel['species']>,
  ): PlantLinkedSpeciesResponseDto {
    return {
      id: species.id,
      name: species.name,
      createdAt: species.createdAt,
      updatedAt: species.updatedAt,
    };
  }
}
