import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('FileFindByIdRequestDto')
export class FileFindByIdRequestDto {
  @Field(() => ID, { description: 'UUID of the file' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
