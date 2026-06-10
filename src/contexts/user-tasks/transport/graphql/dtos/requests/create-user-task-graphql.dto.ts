import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

@InputType('CreateUserTaskInput')
export class CreateUserTaskGraphQLDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @Field(() => Date)
  @IsDateString()
  scheduledDate!: Date;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  taskTemplateId?: string | null;
}
