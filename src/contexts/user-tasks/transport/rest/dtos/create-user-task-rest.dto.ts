import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateUserTaskRestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty()
  @IsDateString()
  scheduledDate!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsUUID()
  @IsOptional()
  taskTemplateId?: string | null;
}
