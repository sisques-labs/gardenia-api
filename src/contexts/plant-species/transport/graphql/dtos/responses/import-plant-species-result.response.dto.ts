import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ImportPlantSpeciesResultResponseDto')
export class ImportPlantSpeciesResultResponseDto {
  @Field(() => Int, { description: 'Number of species successfully imported' })
  imported!: number;

  @Field(() => Int, {
    description: 'Number of species skipped (no enrichment data)',
  })
  skipped!: number;

  @Field(() => Int, { description: 'Number of species that failed to import' })
  errors!: number;
}
