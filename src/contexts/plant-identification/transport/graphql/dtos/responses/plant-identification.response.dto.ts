import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';

@ObjectType('PlantIdentificationPhotoResponseDto')
export class PlantIdentificationPhotoResponseDto {
  @Field(() => String, { description: 'UUID of the underlying file' })
  fileId!: string;

  @Field(() => String, { description: 'Resolved public-facing URL' })
  url!: string;

  @Field(() => PlantIdentificationOrganEnum, {
    description: 'Plant organ tagged on this photo',
  })
  organ!: PlantIdentificationOrganEnum;

  @Field(() => Int, { description: 'Submitted order (0-based)' })
  position!: number;
}

@ObjectType('PlantIdentificationCandidateResponseDto')
export class PlantIdentificationCandidateResponseDto {
  @Field(() => String, { description: "PlantNet's raw scientific name" })
  scientificName!: string;

  @Field(() => [String], { description: 'Common names, if any' })
  commonNames!: string[];

  @Field(() => Number, { description: 'PlantNet confidence score, 0-1' })
  score!: number;

  @Field(() => Int, { description: "PlantNet's own ranking order (0-based)" })
  rank!: number;
}

@ObjectType('PlantIdentificationResponseDto')
export class PlantIdentificationResponseDto {
  @Field(() => ID, { description: 'UUID of the identification attempt' })
  id!: string;

  @Field(() => String, { description: 'UUID of the requesting user' })
  requestedByUserId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => PlantIdentificationStatusEnum, {
    description: 'Outcome of this identification attempt',
  })
  status!: PlantIdentificationStatusEnum;

  @Field(() => Int, {
    nullable: true,
    description:
      'Resolved external catalog key, when confidently auto-resolved',
  })
  resolvedSpeciesKey!: number | null;

  @Field(() => String, {
    nullable: true,
    description: 'Resolved scientific name, when confidently auto-resolved',
  })
  resolvedScientificName!: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'External catalog that resolved this match, e.g. "gbif" (when confidently auto-resolved)',
  })
  resolvedSpeciesProvider!: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'UUID of the plant created from this identification, if any',
  })
  convertedToPlantId!: string | null;

  @Field(() => [PlantIdentificationPhotoResponseDto], {
    description: 'Submitted photos, in submission order',
  })
  photos!: PlantIdentificationPhotoResponseDto[];

  @Field(() => [PlantIdentificationCandidateResponseDto], {
    description: "PlantNet's ranked candidate list",
  })
  candidates!: PlantIdentificationCandidateResponseDto[];

  @Field(() => Date, { description: 'When the identification was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the record was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedPlantIdentificationResultDto')
export class PaginatedPlantIdentificationResultDto extends BasePaginatedResultDto {
  @Field(() => [PlantIdentificationResponseDto], {
    description: 'Plant identifications in the current page',
  })
  items!: PlantIdentificationResponseDto[];
}
