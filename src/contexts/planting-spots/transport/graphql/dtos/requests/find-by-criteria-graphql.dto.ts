import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

@InputType('PlantingSpotFindByCriteriaInput')
export class FindByCriteriaGraphQLDto {
  @Field(() => PlantingSpotTypeEnum, {
    nullable: true,
    description: 'Filter by planting spot type',
  })
  @IsOptional()
  @IsEnum(PlantingSpotTypeEnum)
  type?: PlantingSpotTypeEnum;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 1,
    description: 'Page number (1-based)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Items per page (max 100)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
