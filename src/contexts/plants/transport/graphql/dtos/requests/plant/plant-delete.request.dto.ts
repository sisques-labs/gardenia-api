import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantDeleteRequestDto')
export class PlantDeleteRequestDto {
  @Field(() => String, { description: 'The id of the plant to delete' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
