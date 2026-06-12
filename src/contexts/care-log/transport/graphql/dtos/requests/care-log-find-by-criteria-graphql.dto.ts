import { InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('CareLogFindByCriteriaInput')
export class CareLogFindByCriteriaGraphQLDto extends BaseFindByCriteriaInput {}
