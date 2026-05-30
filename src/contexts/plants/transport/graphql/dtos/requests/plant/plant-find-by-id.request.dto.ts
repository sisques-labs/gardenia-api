import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantFindByIdRequestDto')
export class PlantFindByIdRequestDto {
  @Field(() => String, { description: 'The id of the plant to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
