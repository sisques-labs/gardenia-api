import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import {
  IPlantReadRepository,
  PLANT_READ_REPOSITORY,
} from '@contexts/plants/domain/repositories/read/plant-read.repository';
import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

@Injectable()
export class AssertPlantViewModelExistsService implements IBaseService {
  constructor(
    @Inject(PLANT_READ_REPOSITORY)
    private readonly plantReadRepository: IPlantReadRepository,
  ) {}

  async execute(id: PlantIdValueObject): Promise<PlantViewModel> {
    const plant = await this.plantReadRepository.findById(id.value);
    if (!plant) throw new PlantNotFoundException(id.value);

    return plant;
  }
}
