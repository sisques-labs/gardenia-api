import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the user to add as a member',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;
}
