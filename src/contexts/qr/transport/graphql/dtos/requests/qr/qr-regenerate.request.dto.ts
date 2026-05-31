import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class QrRegenerateRequestDto {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
