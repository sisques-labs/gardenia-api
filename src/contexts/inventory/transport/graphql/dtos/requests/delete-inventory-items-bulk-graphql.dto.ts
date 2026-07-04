import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

@InputType('DeleteInventoryItemsBulkInput')
export class DeleteInventoryItemsBulkGraphQLDto {
  @Field(() => [ID], {
    description: 'Ids of the inventory items to delete (1-100)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids!: string[];
}
