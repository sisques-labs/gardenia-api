import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class QrFindByPlantIdRequestDto {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  plantId!: string;
}
