import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';
import GraphQLJSON from 'graphql-type-json';

import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';

@ObjectType('NotificationResponseDto')
export class NotificationResponseDto {
  @Field(() => ID, { description: 'UUID of the notification' })
  id!: string;

  @Field(() => NotificationTypeEnum, { description: 'Notification type' })
  type!: NotificationTypeEnum;

  @Field(() => NotificationReferenceTypeEnum, {
    description: 'Referenced entity kind',
  })
  referenceType!: NotificationReferenceTypeEnum;

  @Field(() => ID, { description: 'UUID of the referenced entity' })
  referenceId!: string;

  @Field(() => GraphQLJSON, {
    description: 'Display-ready snapshot data, shape depends on type',
  })
  payload!: Record<string, unknown>;

  @Field(() => NotificationStatusEnum, { description: 'Read state' })
  status!: NotificationStatusEnum;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'When the recipient read it, if ever',
  })
  readAt!: Date | null;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'When the underlying condition cleared, if ever',
  })
  resolvedAt!: Date | null;

  @Field(() => String, { description: 'UUID of the recipient' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => GraphQLISODateTime, {
    description: 'When the record was created',
  })
  createdAt!: Date;

  @Field(() => GraphQLISODateTime, {
    description: 'When the record was last updated',
  })
  updatedAt!: Date;
}

@ObjectType('PaginatedNotificationsResultDto')
export class PaginatedNotificationsResultDto extends BasePaginatedResultDto {
  @Field(() => [NotificationResponseDto], {
    description: 'Notifications in the current page',
  })
  items!: NotificationResponseDto[];
}
