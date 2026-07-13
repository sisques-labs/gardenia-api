import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';
import {
  NotificationResponseDto,
  PaginatedNotificationsResultDto,
} from '@contexts/notifications/transport/graphql/dtos/responses/notification.response.dto';

@Injectable()
export class NotificationGraphQLMapper {
  private readonly logger = new Logger(NotificationGraphQLMapper.name);

  toResponseDto(vm: NotificationViewModel): NotificationResponseDto {
    this.logger.log(
      `Mapping notification view model to response dto: ${vm.id}`,
    );
    return {
      id: vm.id,
      type: vm.type as NotificationTypeEnum,
      referenceType: vm.referenceType as NotificationReferenceTypeEnum,
      referenceId: vm.referenceId,
      payload: vm.payload,
      status: vm.status as NotificationStatusEnum,
      readAt: vm.readAt,
      resolvedAt: vm.resolvedAt,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<NotificationViewModel>,
  ): PaginatedNotificationsResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDto(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
