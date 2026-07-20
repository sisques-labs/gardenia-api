import { ApiProperty } from '@nestjs/swagger';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';

export class IdentifyPlantResolvedResponseDto {
  @ApiProperty({ description: 'Resolved external catalog key' })
  speciesKey!: number;

  @ApiProperty({ description: 'Resolved scientific name' })
  scientificName!: string;

  @ApiProperty({
    description: 'External catalog that resolved this match, e.g. "gbif"',
  })
  provider!: string;
}

export class IdentifyPlantPhotoResponseDto {
  @ApiProperty({ description: 'Resolved public-facing URL' })
  url!: string;

  @ApiProperty({ enum: PlantIdentificationOrganEnum })
  organ!: PlantIdentificationOrganEnum;

  @ApiProperty({ description: 'Submitted order (0-based)' })
  position!: number;
}

export class IdentifyPlantCandidateResponseDto {
  @ApiProperty({ description: "PlantNet's raw scientific name" })
  scientificName!: string;

  @ApiProperty({ type: [String] })
  commonNames!: string[];

  @ApiProperty({ description: 'PlantNet confidence score, 0-1' })
  score!: number;

  @ApiProperty({ description: "PlantNet's own ranking order (0-based)" })
  rank!: number;
}

export class IdentifyPlantResponseDto {
  @ApiProperty({ description: 'UUID of the identification attempt' })
  id!: string;

  @ApiProperty({ enum: PlantIdentificationStatusEnum })
  status!: PlantIdentificationStatusEnum;

  @ApiProperty({
    type: IdentifyPlantResolvedResponseDto,
    nullable: true,
    description:
      'Set only when the top candidate cleared the confidence threshold',
  })
  resolved!: IdentifyPlantResolvedResponseDto | null;

  @ApiProperty({ type: [IdentifyPlantCandidateResponseDto] })
  candidates!: IdentifyPlantCandidateResponseDto[];

  @ApiProperty({ type: [IdentifyPlantPhotoResponseDto] })
  photos!: IdentifyPlantPhotoResponseDto[];

  @ApiProperty({ description: 'When the identification was created' })
  createdAt!: Date;
}
