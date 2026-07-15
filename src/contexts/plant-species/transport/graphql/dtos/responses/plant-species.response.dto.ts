import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PlantSpeciesResponseDto')
export class PlantSpeciesResponseDto {
  @Field(() => ID, { description: 'The id of the plant species catalog entry' })
  id!: string;

  @Field(() => String, {
    description: 'Species scientific name',
  })
  scientificName!: string;

  @Field(() => Int, {
    nullable: true,
    description: "GBIF's numeric usageKey identifying the species",
  })
  gbifKey!: number | null;

  @Field(() => Date, { description: 'When the catalog entry was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the catalog entry was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedPlantSpeciesResultDto')
export class PaginatedPlantSpeciesResultDto extends BasePaginatedResultDto {
  @Field(() => [PlantSpeciesResponseDto], {
    description: 'The plant species entries in the current page',
  })
  items!: PlantSpeciesResponseDto[];
}
