import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantingSpotFindByIdRequestDto')
export class PlantingSpotFindByIdRequestDto {
  @Field(() => String, { description: 'The id of the planting spot to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
