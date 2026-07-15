import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiProperty({ description: 'UUID of the uploaded file' })
  id!: string;

  @ApiProperty({
    example: '/api/files/123/content',
    description: 'Resolved URL to download the file content',
  })
  url!: string;
}
