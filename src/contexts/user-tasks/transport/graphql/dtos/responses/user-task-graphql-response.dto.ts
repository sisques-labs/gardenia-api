import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('UserTaskResponseDto')
export class UserTaskGraphQLResponseDto {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String)
  status!: string;

  @Field(() => Date)
  scheduledDate!: Date;

  @Field(() => ID, { nullable: true })
  taskTemplateId!: string | null;

  @Field(() => ID)
  userId!: string;

  @Field(() => Date, { nullable: true })
  completedAt!: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
