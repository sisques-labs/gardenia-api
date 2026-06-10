import { ApiProperty } from '@nestjs/swagger';

export class UserTaskRestResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty() scheduledDate!: Date;
  @ApiProperty({ nullable: true }) taskTemplateId!: string | null;
  @ApiProperty() userId!: string;
  @ApiProperty({ nullable: true }) completedAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
