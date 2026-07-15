import { ApiProperty } from '@nestjs/swagger';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';

export class PlantIdentificationPhotoRestResponseDto {
  @ApiProperty({ description: 'UUID of the underlying file' })
  fileId!: string;

  @ApiProperty({ description: 'Resolved public-facing URL' })
  url!: string;

  @ApiProperty({ enum: PlantIdentificationOrganEnum })
  organ!: PlantIdentificationOrganEnum;

  @ApiProperty({ description: 'Submitted order (0-based)' })
  position!: number;
}

export class PlantIdentificationCandidateRestResponseDto {
  @ApiProperty({ description: "PlantNet's raw scientific name" })
  scientificName!: string;

  @ApiProperty({ type: [String] })
  commonNames!: string[];

  @ApiProperty({ description: 'PlantNet confidence score, 0-1' })
  score!: number;

  @ApiProperty({ description: "PlantNet's own ranking order (0-based)" })
  rank!: number;
}

export class PlantIdentificationRestResponseDto {
  @ApiProperty({ description: 'UUID of the identification attempt' })
  id!: string;

  @ApiProperty({ description: 'UUID of the requesting user' })
  requestedByUserId!: string;

  @ApiProperty({ description: 'UUID of the space' })
  spaceId!: string;

  @ApiProperty({ enum: PlantIdentificationStatusEnum })
  status!: PlantIdentificationStatusEnum;

  @ApiProperty({ nullable: true })
  resolvedGbifKey!: number | null;

  @ApiProperty({ nullable: true })
  resolvedScientificName!: string | null;

  @ApiProperty({ nullable: true })
  convertedToPlantId!: string | null;

  @ApiProperty({ type: [PlantIdentificationPhotoRestResponseDto] })
  photos!: PlantIdentificationPhotoRestResponseDto[];

  @ApiProperty({ type: [PlantIdentificationCandidateRestResponseDto] })
  candidates!: PlantIdentificationCandidateRestResponseDto[];

  @ApiProperty({ description: 'When the identification was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the record was last updated' })
  updatedAt!: Date;
}
