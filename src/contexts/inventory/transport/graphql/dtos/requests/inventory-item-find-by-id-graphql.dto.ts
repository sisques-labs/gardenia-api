import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('InventoryItemFindByIdInput')
export class InventoryItemFindByIdGraphQLDto {
  @Field(() => String, { description: 'UUID of the inventory item' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
