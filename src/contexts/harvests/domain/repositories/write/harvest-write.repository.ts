import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';

export const HARVEST_WRITE_REPOSITORY = Symbol('HARVEST_WRITE_REPOSITORY');

export type IHarvestWriteRepository = IBaseWriteRepository<HarvestAggregate>;
