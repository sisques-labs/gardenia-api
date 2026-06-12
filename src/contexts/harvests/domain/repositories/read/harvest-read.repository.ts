import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';

export const HARVEST_READ_REPOSITORY = Symbol('HARVEST_READ_REPOSITORY');

export type IHarvestReadRepository = IBaseReadRepository<HarvestViewModel>;
