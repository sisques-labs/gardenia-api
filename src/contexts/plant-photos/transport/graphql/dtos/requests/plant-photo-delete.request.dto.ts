import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('PlantPhotoDeleteRequestDto')
export class PlantPhotoDeleteRequestDto {
  @Field(() => String, { description: 'UUID of the plant photo to delete' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
