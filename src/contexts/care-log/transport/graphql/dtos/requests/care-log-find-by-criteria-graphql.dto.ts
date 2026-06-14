import { InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('CareLogFindByCriteriaRequestDto')
export class CareLogFindByCriteriaRequestDto extends BaseFindByCriteriaInput {}
