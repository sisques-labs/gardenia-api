import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
