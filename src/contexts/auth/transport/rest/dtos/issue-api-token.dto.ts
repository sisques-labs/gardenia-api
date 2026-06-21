import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class IssueApiTokenDto {
  @ApiProperty({
    example: 'Home Assistant',
    description: 'Human-readable label for the token',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;
}
