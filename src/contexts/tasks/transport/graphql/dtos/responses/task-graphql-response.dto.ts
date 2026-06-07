import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';

@ObjectType('TaskResponseDto')
export class TaskGraphQLResponseDto {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  templateId!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  payload!: string;

  @Field(() => Int)
  priority!: number;

  @Field(() => Int, { nullable: true })
  delayMs!: number | null;

  @Field(() => String, { nullable: true })
  cronExpression!: string | null;

  @Field(() => Boolean)
  isRecurring!: boolean;

  @Field(() => Int, { nullable: true })
  maxRuns!: number | null;

  @Field(() => Int)
  runCount!: number;

  @Field(() => String, { nullable: true })
  idempotencyKey!: string | null;

  @Field(() => String)
  userId!: string;

  @Field(() => Date, { nullable: true })
  scheduledAt!: Date | null;

  @Field(() => Date, { nullable: true })
  startedAt!: Date | null;

  @Field(() => Date, { nullable: true })
  completedAt!: Date | null;

  @Field(() => Date, { nullable: true })
  failedAt!: Date | null;

  @Field(() => Date, { nullable: true })
  cancelledAt!: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType('PaginatedTaskResultDto')
export class PaginatedTaskResultDto extends BasePaginatedResultDto {
  @Field(() => [TaskGraphQLResponseDto])
  items!: TaskGraphQLResponseDto[];
}
