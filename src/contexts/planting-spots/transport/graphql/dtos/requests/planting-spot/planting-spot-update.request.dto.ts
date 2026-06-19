import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotDimensionsInput } from './planting-spot-create.request.dto';

@InputType('PlantingSpotUpdateRequestDto')
export class PlantingSpotUpdateRequestDto {
  @Field(() => String, { description: 'The id of the planting spot to update' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Updated name of the planting spot',
  })
  @IsOptional()
  name?: string;

  @Field(() => PlantingSpotTypeEnum, {
    nullable: true,
    description: 'Updated type of the planting spot',
  })
  @IsOptional()
  @IsEnum(PlantingSpotTypeEnum)
  type?: PlantingSpotTypeEnum;

  @Field(() => String, {
    nullable: true,
    description: 'Updated description; null to clear',
  })
  @IsOptional()
  description?: string | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Updated capacity; null to remove limit',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Updated row in grid; null to unset',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  row?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Updated column in grid; null to unset',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  column?: number | null;

  @Field(() => PlantingSpotDimensionsInput, {
    nullable: true,
    description: 'Updated dimensions; null to clear',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlantingSpotDimensionsInput)
  dimensions?: PlantingSpotDimensionsInput | null;

  @Field(() => String, {
    nullable: true,
    description: 'Updated soil type; null to clear',
  })
  @IsOptional()
  soilType?: string | null;
}
