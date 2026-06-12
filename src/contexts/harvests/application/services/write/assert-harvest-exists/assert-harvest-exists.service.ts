import { Inject, Injectable } from '@nestjs/common';

import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import { HarvestNotFoundException } from '@contexts/harvests/domain/exceptions/harvest-not-found.exception';
import {
  HARVEST_WRITE_REPOSITORY,
  IHarvestWriteRepository,
} from '@contexts/harvests/domain/repositories/write/harvest-write.repository';
import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';

@Injectable()
export class AssertHarvestExistsService {
  constructor(
    @Inject(HARVEST_WRITE_REPOSITORY)
    private readonly harvestWriteRepository: IHarvestWriteRepository,
  ) {}

  async execute(id: HarvestIdValueObject): Promise<HarvestAggregate> {
    const harvest = await this.harvestWriteRepository.findById(id.value);
    if (!harvest) throw new HarvestNotFoundException(id.value);
    return harvest;
  }
}
