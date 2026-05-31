import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePlantSpeciesDto {
  @ApiProperty({
    example: 'Monstera',
    description: 'Globally unique species name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
