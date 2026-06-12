import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';

export const HARVEST_READ_REPOSITORY = Symbol('HARVEST_READ_REPOSITORY');

export type HarvestCriteria = {
  cropType?: string;
  unit?: HarvestUnitEnum;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
};

export interface IHarvestReadRepository {
  findById(id: string): Promise<HarvestViewModel | null>;
  findByCriteria(
    criteria: HarvestCriteria,
  ): Promise<PaginatedResult<HarvestViewModel>>;
  save(vm: HarvestViewModel): Promise<void>;
  delete(id: string): Promise<void>;
}
