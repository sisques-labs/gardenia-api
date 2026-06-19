import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

@InputType('PlantingSpotDimensionsInput')
export class PlantingSpotDimensionsInput {
  @Field(() => Float, { nullable: true, description: 'Width in metres' })
  @IsOptional()
  @IsNumber()
  width?: number | null;

  @Field(() => Float, { nullable: true, description: 'Height in metres' })
  @IsOptional()
  @IsNumber()
  height?: number | null;

  @Field(() => Float, { nullable: true, description: 'Length in metres' })
  @IsOptional()
  @IsNumber()
  length?: number | null;
}

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

  @Field(() => PlantingSpotDimensionsInput, {
    nullable: true,
    description: 'Physical dimensions (width, height, length in metres)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlantingSpotDimensionsInput)
  dimensions?: PlantingSpotDimensionsInput | null;

  @Field(() => String, { nullable: true, description: 'Type of soil' })
  @IsOptional()
  @IsString()
  soilType?: string | null;
}
