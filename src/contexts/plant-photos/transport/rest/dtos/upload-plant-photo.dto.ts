import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UploadPlantPhotoDto {
  @ApiProperty({ description: 'UUID of the plant this photo belongs to' })
  @IsUUID()
  @IsNotEmpty()
  plantId!: string;
}
