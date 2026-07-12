import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { NodeTelemetryReadingViewModel } from '@contexts/nodes/domain/view-models/node-telemetry-reading.view-model';
import {
  NodeTelemetryReadingResponseDto,
  PaginatedNodeTelemetryReadingResultDto,
} from '../dtos/responses/node-telemetry-reading.response.dto';

@Injectable()
export class NodeTelemetryReadingGraphQLMapper {
  toResponseDtoFromViewModel(
    vm: NodeTelemetryReadingViewModel,
  ): NodeTelemetryReadingResponseDto {
    return {
      id: vm.id,
      spaceId: vm.spaceId,
      nodeId: vm.nodeId,
      sensorType: vm.sensorType,
      value: vm.value,
      unit: vm.unit,
      recordedAt: vm.recordedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<NodeTelemetryReadingViewModel>,
  ): PaginatedNodeTelemetryReadingResultDto {
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
