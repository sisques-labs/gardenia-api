import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType('PlantUpdateRequestDto')
export class PlantUpdateRequestDto {
  @Field(() => String, { description: 'The id of the plant to update' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => String, {
    nullable: true,
    description: 'The name of the plant',
  })
  @IsOptional()
  @IsString()
  name?: string;

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
