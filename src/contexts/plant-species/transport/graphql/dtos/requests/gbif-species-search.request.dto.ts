import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType('GbifSpeciesSearchRequestDto')
export class GbifSpeciesSearchRequestDto {
  @Field(() => String, { description: 'Species name to search for' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of suggestions to return (default 10, max 20)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
