import { ApiProperty } from '@nestjs/swagger';

export class SpaceRestResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the space',
  })
  id!: string;

  @ApiProperty({
    example: 'My Space',
    description: 'Name of the space',
  })
  name!: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
    description: 'UUID of the space owner',
  })
  ownerId!: string;

  @ApiProperty({
    description: 'When the space was created',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'When the space was last updated',
  })
  updatedAt!: Date;
}
