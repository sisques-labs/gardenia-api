import { Field, ID, InputType } from '@nestjs/graphql';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

@InputType('GenerateUserTasksFromTemplateInput')
export class GenerateUserTasksFromTemplateGraphQLDto {
  @Field(() => ID)
  @IsUUID()
  taskTemplateId!: string;

  @Field(() => Date)
  @IsDateString()
  startDate!: Date;

  @Field(() => Date)
  @IsDateString()
  endDate!: Date;

  @Field(() => Number, { nullable: true, defaultValue: 1 })
  @IsOptional()
  intervalDays?: number;
}
