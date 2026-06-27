import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('FileDeleteRequestDto')
export class FileDeleteRequestDto {
  @Field(() => ID, { description: 'UUID of the file to delete' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
