import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@InputType('PlantSpeciesCreateRequestDto')
export class PlantSpeciesCreateRequestDto {
  @Field(() => String, {
    description: 'Species scientific name',
  })
  @IsString()
  @IsNotEmpty()
  scientificName!: string;

  @Field(() => Int, {
    description: "GBIF's numeric usageKey identifying the species",
  })
  @IsInt()
  @Min(1)
  gbifKey!: number;
}
