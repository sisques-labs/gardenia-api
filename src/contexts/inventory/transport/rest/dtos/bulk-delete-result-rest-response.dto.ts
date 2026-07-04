import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteResultRestResponseDto {
  @ApiProperty({ type: [String], description: 'Ids that were deleted' })
  deletedIds!: string[];

  @ApiProperty({
    type: [String],
    description:
      'Ids that were not found or did not belong to the active space',
  })
  notFoundIds!: string[];

  @ApiProperty({ description: 'Number of items actually deleted' })
  deletedCount!: number;

  @ApiProperty({ description: 'Number of unique ids requested' })
  requestedCount!: number;
}
