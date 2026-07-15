import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantingSpotMarkFallowRequestDto')
export class PlantingSpotMarkFallowRequestDto {
  @Field(() => String, {
    description: 'The id of the planting spot to mark fallow',
  })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
