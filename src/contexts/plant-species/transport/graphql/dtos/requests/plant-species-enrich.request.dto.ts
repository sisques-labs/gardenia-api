import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType('PlantSpeciesEnrichRequestDto')
export class PlantSpeciesEnrichRequestDto {
  @Field(() => String, {
    description:
      'Scientific name to resolve against the external catalog. The species is only persisted when enrichment data is found.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  scientificName!: string;
}
