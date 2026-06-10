import { Field, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType('CreateTaskInput')
export class CreateTaskGraphQLDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @Field(() => String, { nullable: true })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string | null;
}
