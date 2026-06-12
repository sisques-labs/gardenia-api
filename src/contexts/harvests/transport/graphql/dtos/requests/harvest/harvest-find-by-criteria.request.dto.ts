import { InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('HarvestFindByCriteriaRequestDto')
export class HarvestFindByCriteriaRequestDto extends BaseFindByCriteriaInput {}
