import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantSpeciesFindByIdRequestDto')
export class PlantSpeciesFindByIdRequestDto {
  @Field(() => ID, { description: 'The id of the plant species to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
