import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('PlantCreateRequestDto')
export class PlantCreateRequestDto {
  @Field(() => String, { description: 'The name of the plant' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String, {
    nullable: true,
    description: 'The species of the plant',
  })
  @IsOptional()
  @IsString()
  species?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
