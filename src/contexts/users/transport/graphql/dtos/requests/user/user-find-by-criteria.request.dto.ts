import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { UserFilterInput } from '@contexts/users/transport/graphql/dtos/requests/user/user-filter.input';
import { UserSortInput } from '@contexts/users/transport/graphql/dtos/requests/user/user-sort.input';

@InputType('UserFindByCriteriaRequestDto')
export class UserFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [UserFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserFilterInput)
  declare filters?: UserFilterInput[];

  @Field(() => [UserSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserSortInput)
  declare sorts?: UserSortInput[];
}
