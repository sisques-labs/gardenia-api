import { ApiProperty } from '@nestjs/swagger';

export class PlantPhotoRestResponseDto {
  @ApiProperty({ description: 'UUID of the plant photo' })
  id!: string;

  @ApiProperty({ description: 'UUID of the plant' })
  plantId!: string;

  @ApiProperty({ description: 'UUID of the underlying file' })
  fileId!: string;

  @ApiProperty({
    example: '/api/files/123/content',
    description: 'Resolved URL to the photo',
  })
  url!: string;

  @ApiProperty({ description: 'UUID of the user who uploaded the photo' })
  userId!: string;

  @ApiProperty({ description: 'UUID of the space' })
  spaceId!: string;

  @ApiProperty({ description: 'When the photo was uploaded' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the record was last updated' })
  updatedAt!: Date;
}
