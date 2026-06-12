import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePlantSpeciesDto {
  @ApiProperty({
    example: 'Monstera deliciosa',
    description: 'Globally unique species scientific name',
  })
  @IsString()
  @IsNotEmpty()
  scientificName!: string;
}
