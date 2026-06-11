import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';

@InputType('PlantSpeciesImportRequestDto')
export class PlantSpeciesImportRequestDto {
  @Field(() => Int, { description: 'Maximum number of species to import' })
  @IsInt()
  @Min(1)
  limit!: number;

  @Field(() => Int, { description: 'Offset for paginated import' })
  @IsInt()
  @Min(0)
  offset!: number;
}
