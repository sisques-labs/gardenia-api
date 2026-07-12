import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';
import {
  BridgeResponseDto,
  PaginatedBridgeResultDto,
} from '../dtos/responses/bridge.response.dto';

@Injectable()
export class BridgeGraphQLMapper {
  toResponseDtoFromViewModel(vm: BridgeViewModel): BridgeResponseDto {
    return {
      id: vm.id,
      spaceId: vm.spaceId,
      name: vm.name,
      status: vm.status,
      lastSeenAt: vm.lastSeenAt,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<BridgeViewModel>,
  ): PaginatedBridgeResultDto {
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
