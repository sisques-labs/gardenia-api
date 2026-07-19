import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IdentifyPlantDto {
  @ApiProperty({
    description:
      'JSON-encoded array of organs, index-aligned to the "photos" files ' +
      '(e.g. ["leaf","flower"]). Must have the same length as the number ' +
      'of uploaded photos.',
    example: '["leaf","flower"]',
  })
  @IsString()
  @IsNotEmpty()
  organs!: string;

  @ApiPropertyOptional({
    description: 'PlantNet dataset/project slug, defaults to "all"',
    example: 'all',
  })
  @IsOptional()
  @IsString()
  project?: string;
}
