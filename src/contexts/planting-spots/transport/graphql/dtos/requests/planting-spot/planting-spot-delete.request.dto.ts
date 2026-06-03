import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantingSpotDeleteRequestDto')
export class PlantingSpotDeleteRequestDto {
  @Field(() => String, { description: 'The id of the planting spot to delete' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
