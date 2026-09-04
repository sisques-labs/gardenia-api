import { Inject, Injectable } from '@nestjs/common';
import { IBaseService, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '@contexts/plants/domain/repositories/write/plant-write.repository';

@Injectable()
export class AssertPlantExistsService implements IBaseService {
  constructor(
    @Inject(PLANT_WRITE_REPOSITORY)
    private readonly plantWriteRepository: IPlantWriteRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<PlantAggregate> {
    const plant = await this.plantWriteRepository.findById(id.value);
    if (!plant) throw new PlantNotFoundException(id.value);

    return plant;
  }
}
