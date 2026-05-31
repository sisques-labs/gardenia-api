import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';
import { InputType } from '@nestjs/graphql';

@InputType('PlantSpeciesFindByCriteriaRequestDto')
export class PlantSpeciesFindByCriteriaRequestDto extends BaseFindByCriteriaInput {}
