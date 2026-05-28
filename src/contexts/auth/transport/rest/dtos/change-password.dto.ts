import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'currentP@ssw0rd',
    description: 'Current password',
  })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    example: 'newP@ssw0rd123',
    description: 'New password (min 8 chars)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
