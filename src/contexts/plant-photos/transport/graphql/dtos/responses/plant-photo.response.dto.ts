import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

@ObjectType('PlantPhotoResponseDto')
export class PlantPhotoResponseDto {
  @Field(() => ID, { description: 'UUID of the plant photo' })
  id!: string;

  @Field(() => String, { description: 'UUID of the plant' })
  plantId!: string;

  @Field(() => String, { description: 'UUID of the underlying file' })
  fileId!: string;

  @Field(() => String, { description: 'Resolved public-facing URL' })
  url!: string;

  @Field(() => String, { description: 'UUID of the uploader' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => Date, { description: 'When the photo was uploaded' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the record was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedPlantPhotoResultDto')
export class PaginatedPlantPhotoResultDto extends BasePaginatedResultDto {
  @Field(() => [PlantPhotoResponseDto], {
    description: 'Plant photos in the current page',
  })
  items!: PlantPhotoResponseDto[];
}
