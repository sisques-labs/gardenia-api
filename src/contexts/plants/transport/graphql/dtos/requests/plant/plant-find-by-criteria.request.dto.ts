import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';
import { InputType } from '@nestjs/graphql';

@InputType('PlantFindByCriteriaRequestDto')
export class PlantFindByCriteriaRequestDto extends BaseFindByCriteriaInput {}
