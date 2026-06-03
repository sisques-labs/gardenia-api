import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
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
  ): PlantingSpotResponseDto {
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
