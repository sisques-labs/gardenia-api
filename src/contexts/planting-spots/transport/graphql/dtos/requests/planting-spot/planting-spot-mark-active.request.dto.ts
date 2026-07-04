import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantingSpotMarkActiveRequestDto')
export class PlantingSpotMarkActiveRequestDto {
  @Field(() => String, {
    description: 'The id of the planting spot to mark active',
  })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
