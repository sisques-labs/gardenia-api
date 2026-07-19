import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantIdentificationFindByIdRequestDto')
export class PlantIdentificationFindByIdRequestDto {
  @Field(() => String, { description: 'UUID of the plant identification' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
