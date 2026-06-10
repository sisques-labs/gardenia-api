import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class GenerateUserTasksFromTemplateRestDto {
  @ApiProperty()
  @IsUUID()
  taskTemplateId!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty({ required: false, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  intervalDays?: number;
}
