import { InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';

@InputType('PlantingSpotFindByCriteriaRequestDto')
export class PlantingSpotFindByCriteriaRequestDto extends BaseFindByCriteriaInput {}
