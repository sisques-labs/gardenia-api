import { Inject, Injectable } from '@nestjs/common';

import { PlantPhotoNotFoundException } from '@contexts/plant-photos/domain/exceptions/plant-photo-not-found.exception';
import {
  PLANT_PHOTO_READ_REPOSITORY,
  IPlantPhotoReadRepository,
} from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';

@Injectable()
export class AssertPlantPhotoViewModelExistsService {
  constructor(
    @Inject(PLANT_PHOTO_READ_REPOSITORY)
    private readonly plantPhotoReadRepository: IPlantPhotoReadRepository,
  ) {}

  async execute(id: PlantPhotoIdValueObject): Promise<PlantPhotoViewModel> {
    const photo = await this.plantPhotoReadRepository.findById(id.value);
    if (!photo) throw new PlantPhotoNotFoundException(id.value);
    return photo;
  }
}
