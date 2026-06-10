import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';

@ObjectType('TaskTemplateResponseDto')
export class TaskTemplateGraphQLResponseDto {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  handlerKey!: string | null;

  @Field(() => Int)
  defaultPriority!: number;

  @Field(() => Int)
  defaultRetryCount!: number;

  @Field(() => String)
  defaultBackoffStrategy!: string;

  @Field(() => Int)
  defaultTimeoutMs!: number;

  @Field(() => Int)
  maxConcurrency!: number;

  @Field(() => String, { nullable: true })
  defaultCronExpression!: string | null;

  @Field(() => Boolean)
  defaultIsRecurring!: boolean;

  @Field(() => String)
  userId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType('PaginatedTaskTemplateResultDto')
export class PaginatedTaskTemplateResultDto extends BasePaginatedResultDto {
  @Field(() => [TaskTemplateGraphQLResponseDto])
  items!: TaskTemplateGraphQLResponseDto[];
}
