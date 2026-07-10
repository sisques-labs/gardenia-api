import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreatePlantSpeciesDto {
  @ApiProperty({
    example: 'Monstera deliciosa',
    description: 'Species scientific name',
  })
  @IsString()
  @IsNotEmpty()
  scientificName!: string;

  @ApiProperty({
    example: 2882337,
    description: "GBIF's numeric usageKey identifying the species",
  })
  @IsInt()
  @Min(1)
  gbifKey!: number;
}
