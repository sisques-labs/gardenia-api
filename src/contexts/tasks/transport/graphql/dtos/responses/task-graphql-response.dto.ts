import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('TaskRunResponseDto')
export class TaskRunGraphQLResponseDto {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  taskId!: string;

  @Field(() => Int)
  attempt!: number;

  @Field(() => String)
  status!: string;

  @Field(() => Int)
  progress!: number;

  @Field(() => String, { nullable: true })
  error!: string | null;

  @Field(() => Date)
  startedAt!: Date;

  @Field(() => Date, { nullable: true })
  endedAt!: Date | null;

  @Field(() => Date)
  createdAt!: Date;
}
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

  @Field(() => String, { nullable: true })
  targetType!: string | null;

  @Field(() => ID, { nullable: true })
  targetId!: string | null;

  @Field(() => Date, { nullable: true })
  validFrom!: Date | null;

  @Field(() => Date, { nullable: true })
  validUntil!: Date | null;

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
