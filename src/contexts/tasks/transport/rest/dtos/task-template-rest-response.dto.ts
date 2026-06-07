import { ApiProperty } from '@nestjs/swagger';

export class TaskTemplateRestResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() handlerKey!: string;
  @ApiProperty() defaultPriority!: number;
  @ApiProperty() defaultRetryCount!: number;
  @ApiProperty() defaultBackoffStrategy!: string;
  @ApiProperty() defaultTimeoutMs!: number;
  @ApiProperty() maxConcurrency!: number;
  @ApiProperty({ nullable: true }) defaultCronExpression!: string | null;
  @ApiProperty() defaultIsRecurring!: boolean;
  @ApiProperty() userId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
