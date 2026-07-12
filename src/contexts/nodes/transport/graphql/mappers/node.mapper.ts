import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { NodeViewModel } from '@contexts/nodes/domain/view-models/node.view-model';
import {
  NodeResponseDto,
  PaginatedNodeResultDto,
} from '../dtos/responses/node.response.dto';

@Injectable()
export class NodeGraphQLMapper {
  toResponseDtoFromViewModel(vm: NodeViewModel): NodeResponseDto {
    return {
      id: vm.id,
      spaceId: vm.spaceId,
      bridgeId: vm.bridgeId,
      name: vm.name,
      status: vm.status,
      lastSeenAt: vm.lastSeenAt,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<NodeViewModel>,
  ): PaginatedNodeResultDto {
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
