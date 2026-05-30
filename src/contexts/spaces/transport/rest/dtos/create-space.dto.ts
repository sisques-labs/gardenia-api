import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty({
    example: 'My Space',
    description: 'Name of the space',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
