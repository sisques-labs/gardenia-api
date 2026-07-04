import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType('WaterPlantInput')
export class WaterPlantGraphQLDto {
  @Field(() => String, { description: 'UUID of the plant to water' })
  @IsUUID()
  @IsNotEmpty()
  plantId!: string;

  @Field(() => Date, {
    nullable: true,
    description: 'When the plant was watered (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;
}
