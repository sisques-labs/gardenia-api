import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import {
  CareScheduleResponseDto,
  PaginatedCareSchedulesResultDto,
} from '@contexts/care-schedule/transport/graphql/dtos/responses/care-schedule.response.dto';

@Injectable()
export class CareScheduleGraphQLMapper {
  private readonly logger = new Logger(CareScheduleGraphQLMapper.name);

  toResponseDto(vm: CareScheduleViewModel): CareScheduleResponseDto {
    this.logger.log(
      `Mapping care schedule view model to response dto: ${vm.id}`,
    );
    return {
      id: vm.id,
      plantId: vm.plantId,
      activityType: vm.activityType as CareScheduleActivityTypeEnum,
      intervalDays: vm.intervalDays,
      quantity: vm.quantity,
      unit: vm.unit as CareScheduleUnitEnum | null,
      notes: vm.notes,
      nextDueAt: vm.nextDueAt,
      lastCompletedAt: vm.lastCompletedAt,
      active: vm.active,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<CareScheduleViewModel>,
  ): PaginatedCareSchedulesResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDto(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
