import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType('PlantCreateRequestDto')
export class PlantCreateRequestDto {
  @Field(() => String, { description: 'The name of the plant' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String, {
    nullable: true,
    description: 'UUID of the plant species catalog entry',
  })
  @IsOptional()
  @IsUUID()
  plantSpeciesId?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
