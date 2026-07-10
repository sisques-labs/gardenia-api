import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

@InputType('PlantCreateRequestDto')
export class PlantCreateRequestDto {
  @Field(() => String, { description: 'The name of the plant' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Int, {
    nullable: true,
    description:
      "GBIF's numeric usageKey of the species to link (from a live search result)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  gbifSpeciesKey?: number;

  @Field(() => String, {
    nullable: true,
    description:
      'Scientific name of the species to link, as chosen from a live search result',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  speciesScientificName?: string;

  @Field(() => String, {
    nullable: true,
    description: 'The image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
