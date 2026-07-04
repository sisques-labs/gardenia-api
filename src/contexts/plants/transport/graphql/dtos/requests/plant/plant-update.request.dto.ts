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
    description: 'UUID of the plant species catalog entry; null to unlink',
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

  @Field(() => String, {
    nullable: true,
    description: 'UUID of the planting spot to assign; null to unassign',
  })
  @IsOptional()
  @IsUUID()
  plantingSpotId?: string | null;
}
