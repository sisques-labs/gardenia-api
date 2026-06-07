import { ApiProperty } from '@nestjs/swagger';

export class TaskRestResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() templateId!: string;
  @ApiProperty() status!: string;
  @ApiProperty() payload!: Record<string, unknown>;
  @ApiProperty() priority!: number;
  @ApiProperty({ nullable: true }) delayMs!: number | null;
  @ApiProperty({ nullable: true }) cronExpression!: string | null;
  @ApiProperty() isRecurring!: boolean;
  @ApiProperty({ nullable: true }) maxRuns!: number | null;
  @ApiProperty() runCount!: number;
  @ApiProperty({ nullable: true }) idempotencyKey!: string | null;
  @ApiProperty() userId!: string;
  @ApiProperty({ nullable: true }) scheduledAt!: Date | null;
  @ApiProperty({ nullable: true }) startedAt!: Date | null;
  @ApiProperty({ nullable: true }) completedAt!: Date | null;
  @ApiProperty({ nullable: true }) failedAt!: Date | null;
  @ApiProperty({ nullable: true }) cancelledAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
