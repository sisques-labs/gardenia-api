import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('RegisterPushSubscriptionInput')
export class RegisterPushSubscriptionGraphQLDto {
  @Field(() => String, {
    description: "The browser's push subscription endpoint URL",
  })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @Field(() => String, {
    description: 'The p256dh key from the browser subscription',
  })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @Field(() => String, {
    description: 'The auth secret from the browser subscription',
  })
  @IsString()
  @IsNotEmpty()
  auth!: string;

  @Field(() => String, { nullable: true, description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
