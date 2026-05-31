import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType('PlantSpeciesCreateRequestDto')
export class PlantSpeciesCreateRequestDto {
  @Field(() => String, { description: 'Globally unique species name' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
