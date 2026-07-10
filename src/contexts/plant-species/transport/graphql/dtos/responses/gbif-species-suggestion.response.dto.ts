import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('GbifSpeciesSuggestionResponseDto')
export class GbifSpeciesSuggestionResponseDto {
  @Field(() => Int, { description: "GBIF's numeric usageKey for the species" })
  gbifKey!: number;

  @Field(() => String, { description: 'Species scientific name' })
  scientificName!: string;
}
