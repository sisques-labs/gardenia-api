import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';
import { InputType } from '@nestjs/graphql';

@InputType('UserFindByCriteriaRequestDto')
export class UserFindByCriteriaRequestDto extends BaseFindByCriteriaInput {}
