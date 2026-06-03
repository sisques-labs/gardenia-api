import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

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
  @IsString()
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
  @IsString()
  description?: string | null;
}
