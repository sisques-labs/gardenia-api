import { ApiProperty } from '@nestjs/swagger';

export class FileRestResponseDto {
  @ApiProperty({ description: 'UUID of the file' })
  id!: string;

  @ApiProperty({ example: 'rose.png', description: 'Original filename' })
  filename!: string;

  @ApiProperty({ example: 'image/png', description: 'MIME type' })
  mimeType!: string;

  @ApiProperty({ example: 204800, description: 'Size in bytes' })
  size!: number;

  @ApiProperty({
    example: '/api/files/123/content',
    description: 'Resolved URL to download the file content',
  })
  url!: string;

  @ApiProperty({ description: 'UUID of the user who uploaded the file' })
  userId!: string;

  @ApiProperty({ description: 'UUID of the space' })
  spaceId!: string;

  @ApiProperty({ description: 'When the file was uploaded' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the record was last updated' })
  updatedAt!: Date;
}
