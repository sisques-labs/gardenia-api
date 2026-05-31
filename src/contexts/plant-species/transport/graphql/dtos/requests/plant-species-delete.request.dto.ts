import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType('PlantSpeciesDeleteRequestDto')
export class PlantSpeciesDeleteRequestDto {
  @Field(() => String, { description: 'The id of the plant species to delete' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
