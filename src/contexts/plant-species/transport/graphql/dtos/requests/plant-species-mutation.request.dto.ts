import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('PlantSpeciesCreateRequestDto')
export class PlantSpeciesCreateRequestDto {
  @Field(() => String, { description: 'Globally unique species name' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

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

@InputType('PlantSpeciesDeleteRequestDto')
export class PlantSpeciesDeleteRequestDto {
  @Field(() => String, { description: 'The id of the plant species to delete' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
