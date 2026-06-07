import { InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('TaskTemplateFindByCriteriaInput')
export class TaskTemplateFindByCriteriaGraphQLDto extends BaseFindByCriteriaInput {}
