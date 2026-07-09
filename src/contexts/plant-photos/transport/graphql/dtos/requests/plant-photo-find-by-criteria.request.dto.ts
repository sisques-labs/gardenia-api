import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { PlantPhotoFilterInput } from '@contexts/plant-photos/transport/graphql/dtos/requests/plant-photo-filter.input';
import { PlantPhotoSortInput } from '@contexts/plant-photos/transport/graphql/dtos/requests/plant-photo-sort.input';

@InputType('PlantPhotoFindByCriteriaRequestDto')
export class PlantPhotoFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [PlantPhotoFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantPhotoFilterInput)
  declare filters?: PlantPhotoFilterInput[];

  @Field(() => [PlantPhotoSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantPhotoSortInput)
  declare sorts?: PlantPhotoSortInput[];
}
