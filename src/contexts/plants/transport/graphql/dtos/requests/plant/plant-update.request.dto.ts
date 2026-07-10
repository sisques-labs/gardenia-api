import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

@InputType('PlantUpdateRequestDto')
export class PlantUpdateRequestDto {
  @Field(() => String, { description: 'The id of the plant to update' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => String, {
    nullable: true,
    description: 'The name of the plant',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Int, {
    nullable: true,
    description:
      "GBIF's numeric usageKey of the species to link (from a live search result); null to unlink",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  gbifSpeciesKey?: number | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Scientific name of the species to link, as chosen from a live search result; null to unlink',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  speciesScientificName?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'UUID of the planting spot to assign; null to unassign',
  })
  @IsOptional()
  @IsUUID()
  plantingSpotId?: string | null;
}
