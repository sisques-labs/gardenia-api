import { Injectable, Logger } from '@nestjs/common';

import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

import {
  PaginatedPlantingSpotResultDto,
  PlantingSpotResponseDto,
} from '../../dtos/responses/planting-spot.response.dto';

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

@Injectable()
export class PlantingSpotGraphQLMapper {
  private readonly logger = new Logger(PlantingSpotGraphQLMapper.name);

  toResponseDto(vm: PlantingSpotViewModel): PlantingSpotResponseDto {
    this.logger.log(
      `Mapping planting spot view model to response dto: ${vm.id}`,
    );

    return {
      id: vm.id,
      name: vm.name,
      type: vm.type as PlantingSpotTypeEnum,
      description: vm.description,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<PlantingSpotViewModel>,
  ): PaginatedPlantingSpotResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDto(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
