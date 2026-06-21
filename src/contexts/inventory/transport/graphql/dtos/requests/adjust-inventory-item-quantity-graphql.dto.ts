import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType('AdjustInventoryItemQuantityInput')
export class AdjustInventoryItemQuantityGraphQLDto {
  @Field(() => String, { description: 'UUID of the item to adjust' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => Number, {
    description: 'Signed adjustment. Negative consumes, positive restocks.',
  })
  @IsNumber()
  delta!: number;

  @Field(() => String, { description: 'Reason for the adjustment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
