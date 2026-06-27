import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';

@InputType('FileFindByCriteriaRequestDto')
export class FileFindByCriteriaRequestDto {
  @Field(() => FileMimeTypeEnum, {
    nullable: true,
    description: 'Filter by exact MIME type',
  })
  @IsOptional()
  @IsEnum(FileMimeTypeEnum)
  mimeType?: FileMimeTypeEnum;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by partial filename match',
  })
  @IsOptional()
  @IsString()
  filename?: string;

  @Field(() => Int, { nullable: true, description: '1-based page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, description: 'Items per page (max 100)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
