import { InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('TaskFindByCriteriaInput')
export class TaskFindByCriteriaGraphQLDto extends BaseFindByCriteriaInput {}
