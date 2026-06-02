import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotCriteria } from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';

export interface PlantingSpotFindByCriteriaQueryInput {
  spaceId: string;
  type?: PlantingSpotTypeEnum;
  page?: number;
  limit?: number;
}

export class PlantingSpotFindByCriteriaQuery {
  public readonly criteria: PlantingSpotCriteria;

  constructor(input: PlantingSpotFindByCriteriaQueryInput) {
    this.criteria = {
      spaceId: input.spaceId,
      type: input.type,
      page: input.page ?? 1,
      limit: Math.min(input.limit ?? 20, 100),
    };
  }
}
