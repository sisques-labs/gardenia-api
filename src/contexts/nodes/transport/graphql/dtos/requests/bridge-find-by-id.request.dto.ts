import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('BridgeFindByIdRequestDto')
export class BridgeFindByIdRequestDto {
  @Field(() => String, { description: 'The id of the bridge to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
