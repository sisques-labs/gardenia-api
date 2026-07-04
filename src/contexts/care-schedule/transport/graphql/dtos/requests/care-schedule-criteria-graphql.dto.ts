import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { CareScheduleFilterInput } from '@contexts/care-schedule/transport/graphql/dtos/requests/care-schedule-filter.input';
import { CareScheduleSortInput } from '@contexts/care-schedule/transport/graphql/dtos/requests/care-schedule-sort.input';

@InputType('CareScheduleCriteriaInput')
export class CareScheduleCriteriaGraphQLDto extends BaseFindByCriteriaInput {
  @Field(() => [CareScheduleFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CareScheduleFilterInput)
  declare filters?: CareScheduleFilterInput[];

  @Field(() => [CareScheduleSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CareScheduleSortInput)
  declare sorts?: CareScheduleSortInput[];
}
