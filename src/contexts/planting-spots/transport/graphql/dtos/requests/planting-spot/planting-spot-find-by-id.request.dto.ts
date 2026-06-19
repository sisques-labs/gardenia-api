import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType('PlantingSpotFindByIdRequestDto')
export class PlantingSpotFindByIdRequestDto {
  @Field(() => String, { description: 'The id of the planting spot to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'When true, resolves and returns the plants assigned to this spot',
  })
  @IsOptional()
  @IsBoolean()
  resolve?: boolean;
}
