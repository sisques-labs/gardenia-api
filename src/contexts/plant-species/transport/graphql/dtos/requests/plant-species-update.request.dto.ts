import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('PlantSpeciesUpdateRequestDto')
export class PlantSpeciesUpdateRequestDto {
  @Field(() => String, { description: 'The id of the plant species to update' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Updated globally unique species scientific name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  scientificName?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Updated species description',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Updated species image URL',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
