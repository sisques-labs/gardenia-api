import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType('CompleteCareScheduleInput')
export class CompleteCareScheduleGraphQLDto {
  @Field(() => String, { description: 'UUID of the care schedule to complete' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => Date, {
    nullable: true,
    description: 'When the care was completed (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedAt?: Date;
}
