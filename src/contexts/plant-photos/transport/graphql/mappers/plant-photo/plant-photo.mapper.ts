import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import {
  PaginatedPlantPhotoResultDto,
  PlantPhotoResponseDto,
} from '@contexts/plant-photos/transport/graphql/dtos/responses/plant-photo.response.dto';

@Injectable()
export class PlantPhotoGraphQLMapper {
  private readonly logger = new Logger(PlantPhotoGraphQLMapper.name);

  toResponseDto(vm: PlantPhotoViewModel): PlantPhotoResponseDto {
    this.logger.log(`Mapping plant photo view model to response dto: ${vm.id}`);
    return {
      id: vm.id,
      plantId: vm.plantId,
      fileId: vm.fileId,
      url: vm.url,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<PlantPhotoViewModel>,
  ): PaginatedPlantPhotoResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDto(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
