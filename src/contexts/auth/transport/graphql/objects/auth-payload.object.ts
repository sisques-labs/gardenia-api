import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthPayloadObject {
  @Field(() => String)
  accessToken!: string;
}
