import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

@InputType('PlantSpeciesUpdateRequestDto')
export class PlantSpeciesUpdateRequestDto {
  @Field(() => String, { description: 'The id of the plant species to update' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Updated species scientific name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  scientificName?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Updated GBIF usageKey identifying the species',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  gbifKey?: number;
}
