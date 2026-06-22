import { IPlantSpeciesReferencePort } from '@contexts/plant-species/application/ports/plant-species-reference.port';
import { PlantSpeciesInUseException } from '@contexts/plant-species/domain/exceptions/plant-species-in-use.exception';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { AssertPlantSpeciesNotInUseService } from './assert-plant-species-not-in-use.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertPlantSpeciesNotInUseService', () => {
  let service: AssertPlantSpeciesNotInUseService;
  let referencePort: jest.Mocked<IPlantSpeciesReferencePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    referencePort = {
      countPlantsBySpeciesId: jest.fn(),
    } as unknown as jest.Mocked<IPlantSpeciesReferencePort>;
    service = new AssertPlantSpeciesNotInUseService(referencePort);
  });

  it('resolves when the species is not referenced by any plant', async () => {
    referencePort.countPlantsBySpeciesId.mockResolvedValue(0);

    await expect(
      service.execute(new PlantSpeciesIdValueObject(ID)),
    ).resolves.toBeUndefined();
    expect(referencePort.countPlantsBySpeciesId).toHaveBeenCalledWith(ID);
  });

  it('throws PlantSpeciesInUseException when at least one plant references it', async () => {
    referencePort.countPlantsBySpeciesId.mockResolvedValue(3);

    await expect(
      service.execute(new PlantSpeciesIdValueObject(ID)),
    ).rejects.toThrow(PlantSpeciesInUseException);
  });
});
