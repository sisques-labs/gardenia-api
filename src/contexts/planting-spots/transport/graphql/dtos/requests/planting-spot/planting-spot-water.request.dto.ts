import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType('PlantingSpotWaterRequestDto')
export class PlantingSpotWaterRequestDto {
  @Field(() => String, { description: 'The id of the planting spot to water' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => Date, {
    nullable: true,
    description: 'When the plants were watered (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;
}
