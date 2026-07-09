import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';

@ObjectType('CareLogEntryResponseDto')
export class CareLogEntryResponseDto {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  plantId!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  spaceId!: string;

  @Field(() => CareLogActivityTypeEnum)
  activityType!: string;

  @Field(() => Date)
  performedAt!: Date;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field(() => Number, { nullable: true })
  quantity!: number | null;

  @Field(() => CareLogUnitEnum, { nullable: true })
  unit!: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType('PaginatedCareLogEntryResultDto')
export class PaginatedCareLogEntryResultDto extends BasePaginatedResultDto {
  @Field(() => [CareLogEntryResponseDto])
  items!: CareLogEntryResponseDto[];
}
