import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';

@ObjectType('FileResponseDto')
export class FileResponseDto {
  @Field(() => ID, { description: 'UUID of the file' })
  id!: string;

  @Field(() => String, { description: 'Original filename' })
  filename!: string;

  // Raw MIME string (e.g. "image/png"), kept consistent with the REST response.
  // The enum is only used on the input side (criteria filter); GraphQL would
  // serialize an enum output by its member name (IMAGE_PNG), not its value.
  @Field(() => String, { description: 'MIME type (e.g. image/png)' })
  mimeType!: string;

  @Field(() => Int, { description: 'Size in bytes' })
  size!: number;

  @Field(() => String, { description: 'Resolved URL to download the content' })
  url!: string;

  @Field(() => String, { description: 'UUID of the uploader' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => Date, { description: 'When the file was uploaded' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the record was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedFileResultDto')
export class PaginatedFileResultDto extends BasePaginatedResultDto {
  @Field(() => [FileResponseDto], { description: 'Files in the current page' })
  items!: FileResponseDto[];
}
