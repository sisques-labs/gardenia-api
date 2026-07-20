import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType('CreatePlantFromIdentificationRequestDto')
export class CreatePlantFromIdentificationRequestDto {
  @Field(() => String, {
    description: 'UUID of the resolved plant identification',
  })
  @IsUUID()
  @IsNotEmpty()
  identificationId!: string;

  @Field(() => String, { description: 'Name for the new tracked plant' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional cover image URL for the new plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
