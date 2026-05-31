import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('QrResponseDto')
export class QrResponseDto {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  spaceId!: string;

  @Field(() => String)
  targetUrl!: string;

  @Field(() => Int)
  generation!: number;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}
