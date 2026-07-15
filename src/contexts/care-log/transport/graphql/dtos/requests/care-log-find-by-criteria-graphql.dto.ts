import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { CareLogFilterInput } from '@contexts/care-log/transport/graphql/dtos/requests/care-log-filter.input';
import { CareLogSortInput } from '@contexts/care-log/transport/graphql/dtos/requests/care-log-sort.input';

@InputType('CareLogFindByCriteriaRequestDto')
export class CareLogFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [CareLogFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CareLogFilterInput)
  declare filters?: CareLogFilterInput[];

  @Field(() => [CareLogSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CareLogSortInput)
  declare sorts?: CareLogSortInput[];
}
