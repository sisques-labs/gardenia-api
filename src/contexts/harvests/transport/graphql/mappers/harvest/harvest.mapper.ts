import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import {
  HarvestResponseDto,
  PaginatedHarvestResultDto,
} from '@contexts/harvests/transport/graphql/dtos/responses/harvest.response.dto';

@Injectable()
export class HarvestGraphQLMapper {
  private readonly logger = new Logger(HarvestGraphQLMapper.name);

  toResponseDto(vm: HarvestViewModel): HarvestResponseDto {
    this.logger.log(`Mapping harvest view model to response dto: ${vm.id}`);
    return {
      id: vm.id,
      cropType: vm.cropType,
      quantity: vm.quantity,
      unit: vm.unit as HarvestUnitEnum,
      harvestedAt: vm.harvestedAt,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<HarvestViewModel>,
  ): PaginatedHarvestResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDto(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
