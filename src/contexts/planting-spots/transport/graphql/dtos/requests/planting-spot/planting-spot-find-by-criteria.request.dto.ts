import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('PlantingSpotFindByCriteriaRequestDto')
export class PlantingSpotFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => Boolean, {
    nullable: true,
    description: 'When true, resolves and returns the plants for each spot',
  })
  @IsOptional()
  @IsBoolean()
  resolve?: boolean;
}
