import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('HarvestDeleteRequestDto')
export class HarvestDeleteRequestDto {
  @Field(() => String, { description: 'UUID of the harvest to delete' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
