import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import {
  PaginatedSpaceResultDto,
  SpaceResponseDto,
} from '../../dtos/responses/space/space.response.dto';

@Injectable()
export class SpaceGraphQLMapper {
  private readonly logger = new Logger(SpaceGraphQLMapper.name);

  toResponseDtoFromViewModel(vm: SpaceViewModel): SpaceResponseDto {
    this.logger.log(`Mapping space view model to response dto: ${vm.id}`);

    return {
      id: vm.id,
      name: vm.name,
      ownerId: vm.ownerId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
      latitude: vm.latitude,
      longitude: vm.longitude,
      environment: vm.environment,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<SpaceViewModel>,
  ): PaginatedSpaceResultDto {
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
