import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantPhotoFindByIdRequestDto')
export class PlantPhotoFindByIdRequestDto {
  @Field(() => String, { description: 'UUID of the plant photo' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
