import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('HarvestFindByIdRequestDto')
export class HarvestFindByIdRequestDto {
  @Field(() => String, { description: 'UUID of the harvest' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
