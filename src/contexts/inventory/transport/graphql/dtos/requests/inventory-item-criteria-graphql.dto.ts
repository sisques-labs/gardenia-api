import { InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('InventoryItemCriteriaInput')
export class InventoryItemCriteriaGraphQLDto extends BaseFindByCriteriaInput {}
