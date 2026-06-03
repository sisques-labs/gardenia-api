import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PlantQrResponseDto')
export class PlantQrResponseDto {
  @Field(() => ID, { description: 'UUID of the QR record' })
  id!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => String, { description: 'Deep link URL encoded in the QR' })
  targetUrl!: string;

  @Field(() => Int, {
    description: 'Number of times the QR has been regenerated',
  })
  generation!: number;

  @Field(() => String, { description: 'Base64-encoded PNG of the QR image' })
  image!: string;

  @Field(() => Date, { description: 'When the QR was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the QR was last updated' })
  updatedAt!: Date;
}

@ObjectType('PlantLinkedSpeciesResponseDto')
export class PlantLinkedSpeciesResponseDto {
  @Field(() => ID, { description: 'UUID of the plant species catalog entry' })
  id!: string;

  @Field(() => String, { description: 'Globally unique species name' })
  name!: string;

  @Field(() => Date, { description: 'When the catalog entry was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the catalog entry was last updated' })
  updatedAt!: Date;
}

@ObjectType('PlantResponseDto')
export class PlantResponseDto {
  @Field(() => ID, { description: 'The id of the plant' })
  id!: string;

  @Field(() => String, { description: 'The name of the plant' })
  name!: string;

  @Field(() => ID, {
    nullable: true,
    description: 'UUID of the linked plant species catalog entry',
  })
  plantSpeciesId?: string | null;

  @Field(() => PlantLinkedSpeciesResponseDto, {
    nullable: true,
    description: 'Resolved plant species catalog entry',
  })
  species?: PlantLinkedSpeciesResponseDto | null;

  @Field(() => String, {
    nullable: true,
    description: 'The image URL of the plant',
  })
  imageUrl?: string | null;

  @Field(() => String, { description: 'The id of the plant owner' })
  userId!: string;

  @Field(() => String, { description: 'The id of the space' })
  spaceId!: string;

  @Field(() => PlantQrResponseDto, {
    nullable: true,
    description: 'QR code associated with this plant',
  })
  qr?: PlantQrResponseDto | null;

  @Field(() => ID, {
    nullable: true,
    description: 'UUID of the linked planting spot',
  })
  plantingSpotId?: string | null;

  @Field(() => PlantLinkedPlantingSpotResponseDto, {
    nullable: true,
    description: 'Resolved planting spot linked to this plant',
  })
  plantingSpot?: PlantLinkedPlantingSpotResponseDto | null;

  @Field(() => Date, { description: 'When the plant was created' })
  createdAt!: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'When the plant was last updated',
  })
  updatedAt?: Date;
}

@ObjectType('PlantLinkedPlantingSpotResponseDto')
export class PlantLinkedPlantingSpotResponseDto {
  @Field(() => ID, { description: 'UUID of the planting spot' })
  id!: string;

  @Field(() => String, { description: 'Name of the planting spot' })
  name!: string;

  @Field(() => String, { description: 'Type of the planting spot' })
  type!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional description of the planting spot',
  })
  description?: string | null;

  @Field(() => String, { description: 'UUID of the planting spot owner' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => Date, { description: 'When the planting spot was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the planting spot was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedPlantResultDto')
export class PaginatedPlantResultDto extends BasePaginatedResultDto {
  @Field(() => [PlantResponseDto], {
    description: 'The plants in the current page',
  })
  items!: PlantResponseDto[];
}
