import { ApiProperty } from '@nestjs/swagger';

export class WaterPlantingSpotFailureRestDto {
  @ApiProperty({ description: 'UUID of the plant that failed to be watered' })
  plantId!: string;

  @ApiProperty({ description: 'Reason the watering failed' })
  reason!: string;
}

export class WaterPlantingSpotRestResponseDto {
  @ApiProperty({ description: 'UUID of the watered planting spot' })
  plantingSpotId!: string;

  @ApiProperty({
    type: [String],
    description: 'UUIDs of the plants that were watered successfully',
  })
  wateredPlantIds!: string[];

  @ApiProperty({
    type: [WaterPlantingSpotFailureRestDto],
    description: 'Plants that failed to be watered, with the failure reason',
  })
  failedPlants!: WaterPlantingSpotFailureRestDto[];
}
