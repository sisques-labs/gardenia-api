import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';

@ObjectType('FileResponseDto')
export class FileResponseDto {
  @Field(() => ID, { description: 'UUID of the file' })
  id!: string;

  @Field(() => String, { description: 'Original filename' })
  filename!: string;

  @Field(() => FileMimeTypeEnum, { description: 'MIME type' })
  mimeType!: FileMimeTypeEnum;

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
