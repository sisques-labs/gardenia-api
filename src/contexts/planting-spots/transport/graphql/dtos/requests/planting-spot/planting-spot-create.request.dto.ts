import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

@InputType('PlantingSpotCreateRequestDto')
export class PlantingSpotCreateRequestDto {
  @Field(() => String, { description: 'Name of the planting spot' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => PlantingSpotTypeEnum, {
    description: 'Type of the planting spot',
  })
  @IsEnum(PlantingSpotTypeEnum)
  type!: PlantingSpotTypeEnum;

  @Field(() => String, {
    nullable: true,
    description: 'Optional description of the planting spot',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of plants (soft limit)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Row position in the space grid',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  row?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Column position in the space grid',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  column?: number | null;

  @Field(() => String, {
    nullable: true,
    description: 'Physical dimensions (e.g. "2.4 × 1.2 m")',
  })
  @IsOptional()
  @IsString()
  dimensions?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Type of soil',
  })
  @IsOptional()
  @IsString()
  soilType?: string | null;
}
