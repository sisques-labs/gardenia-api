import { PlantPhotoNotFoundException } from '@contexts/plant-photos/domain/exceptions/plant-photo-not-found.exception';
import { IPlantPhotoReadRepository } from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { AssertPlantPhotoViewModelExistsService } from './assert-plant-photo-view-model-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertPlantPhotoViewModelExistsService', () => {
  let readRepository: jest.Mocked<IPlantPhotoReadRepository>;
  let service: AssertPlantPhotoViewModelExistsService;

  beforeEach(() => {
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantPhotoReadRepository>;
    service = new AssertPlantPhotoViewModelExistsService(readRepository);
  });

  it('returns the view model when found', async () => {
    const vm = {} as PlantPhotoViewModel;
    readRepository.findById.mockResolvedValue(vm);

    const result = await service.execute(new PlantPhotoIdValueObject(ID));

    expect(result).toBe(vm);
  });

  it('throws PlantPhotoNotFoundException when not found', async () => {
    readRepository.findById.mockResolvedValue(null);

    await expect(
      service.execute(new PlantPhotoIdValueObject(ID)),
    ).rejects.toThrow(PlantPhotoNotFoundException);
  });
});
