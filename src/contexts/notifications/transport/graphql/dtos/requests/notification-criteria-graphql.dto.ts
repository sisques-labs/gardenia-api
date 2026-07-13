import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { NotificationFilterInput } from '@contexts/notifications/transport/graphql/dtos/requests/notification-filter.input';
import { NotificationSortInput } from '@contexts/notifications/transport/graphql/dtos/requests/notification-sort.input';

@InputType('NotificationCriteriaInput')
export class NotificationCriteriaGraphQLDto extends BaseFindByCriteriaInput {
  @Field(() => [NotificationFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NotificationFilterInput)
  declare filters?: NotificationFilterInput[];

  @Field(() => [NotificationSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NotificationSortInput)
  declare sorts?: NotificationSortInput[];
}
