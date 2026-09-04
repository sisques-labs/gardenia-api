import { Inject, Injectable } from '@nestjs/common';

import { HarvestNotFoundException } from '@contexts/harvests/domain/exceptions/harvest-not-found.exception';
import {
  HARVEST_READ_REPOSITORY,
  IHarvestReadRepository,
} from '@contexts/harvests/domain/repositories/read/harvest-read.repository';

import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertHarvestViewModelExistsService {
  constructor(
    @Inject(HARVEST_READ_REPOSITORY)
    private readonly harvestReadRepository: IHarvestReadRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<HarvestViewModel> {
    const harvest = await this.harvestReadRepository.findById(id.value);
    if (!harvest) throw new HarvestNotFoundException(id.value);
    return harvest;
  }
}
