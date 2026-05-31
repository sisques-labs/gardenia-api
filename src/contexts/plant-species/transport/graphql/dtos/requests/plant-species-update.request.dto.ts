import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('PlantSpeciesUpdateRequestDto')
export class PlantSpeciesUpdateRequestDto {
  @Field(() => String, { description: 'The id of the plant species to update' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Updated globally unique species name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
