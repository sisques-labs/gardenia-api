import { InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('CareScheduleCriteriaInput')
export class CareScheduleCriteriaGraphQLDto extends BaseFindByCriteriaInput {}
