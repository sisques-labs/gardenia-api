import { PlantSpeciesNotFoundException } from '@contexts/plant-species/domain/exceptions/plant-species-not-found.exception';
import { IPlantSpeciesReadRepository } from '@contexts/plant-species/domain/repositories/read/plant-species-read.repository';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { AssertPlantSpeciesViewModelExistsService } from './assert-plant-species-view-model-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertPlantSpeciesViewModelExistsService', () => {
  let service: AssertPlantSpeciesViewModelExistsService;
  let readRepository: jest.Mocked<IPlantSpeciesReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IPlantSpeciesReadRepository>;
    service = new AssertPlantSpeciesViewModelExistsService(readRepository);
  });

  it('returns the view model when it exists', async () => {
    const vm = {} as PlantSpeciesViewModel;
    readRepository.findById.mockResolvedValue(vm);

    const result = await service.execute(new PlantSpeciesIdValueObject(ID));

    expect(result).toBe(vm);
    expect(readRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws PlantSpeciesNotFoundException when it does not exist', async () => {
    readRepository.findById.mockResolvedValue(null);

    await expect(
      service.execute(new PlantSpeciesIdValueObject(ID)),
    ).rejects.toThrow(PlantSpeciesNotFoundException);
  });
});
