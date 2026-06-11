import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('PlantSpeciesResponseDto')
export class PlantSpeciesResponseDto {
  @Field(() => ID, { description: 'The id of the plant species catalog entry' })
  id!: string;

  @Field(() => String, {
    description: 'Globally unique species scientific name',
  })
  scientificName!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Species description',
  })
  description!: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Species image URL',
  })
  imageUrl!: string | null;

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
