import { Inject, Injectable } from '@nestjs/common';

import { HarvestNotFoundException } from '@contexts/harvests/domain/exceptions/harvest-not-found.exception';
import {
  HARVEST_READ_REPOSITORY,
  IHarvestReadRepository,
} from '@contexts/harvests/domain/repositories/read/harvest-read.repository';
import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';

@Injectable()
export class AssertHarvestViewModelExistsService {
  constructor(
    @Inject(HARVEST_READ_REPOSITORY)
    private readonly harvestReadRepository: IHarvestReadRepository,
  ) {}

  async execute(id: HarvestIdValueObject): Promise<HarvestViewModel> {
    const harvest = await this.harvestReadRepository.findById(id.value);
    if (!harvest) throw new HarvestNotFoundException(id.value);
    return harvest;
  }
}
