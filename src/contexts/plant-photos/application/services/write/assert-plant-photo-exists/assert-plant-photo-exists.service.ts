import { Inject, Injectable } from '@nestjs/common';

import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoNotFoundException } from '@contexts/plant-photos/domain/exceptions/plant-photo-not-found.exception';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';
import {
  PLANT_PHOTO_WRITE_REPOSITORY,
  IPlantPhotoWriteRepository,
} from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';

@Injectable()
export class AssertPlantPhotoExistsService {
  constructor(
    @Inject(PLANT_PHOTO_WRITE_REPOSITORY)
    private readonly plantPhotoWriteRepository: IPlantPhotoWriteRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<PlantPhotoAggregate> {
    const photo = await this.plantPhotoWriteRepository.findById(id.value);
    if (!photo) throw new PlantPhotoNotFoundException(id.value);
    return photo;
  }
}
