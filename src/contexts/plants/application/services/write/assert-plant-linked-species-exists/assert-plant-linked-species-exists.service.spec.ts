import { IPlantSpeciesPort } from '@contexts/plants/application/ports/plant-species.port';
import { PlantLinkedSpeciesNotFoundException } from '@contexts/plants/domain/exceptions/plant-linked-species-not-found.exception';
import { PlantLinkedSpeciesIdValueObject } from '@contexts/plants/domain/value-objects/plant-linked-species-id/plant-linked-species-id.value-object';
import { AssertPlantLinkedSpeciesExistsService } from './assert-plant-linked-species-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertPlantLinkedSpeciesExistsService', () => {
  let service: AssertPlantLinkedSpeciesExistsService;
  let speciesPort: jest.Mocked<IPlantSpeciesPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    speciesPort = {
      findByPlantSpeciesId: jest.fn(),
    } as unknown as jest.Mocked<IPlantSpeciesPort>;
    service = new AssertPlantLinkedSpeciesExistsService(speciesPort);
  });

  it('resolves when the linked species exists', async () => {
    speciesPort.findByPlantSpeciesId.mockResolvedValue({ id: ID } as never);

    await expect(
      service.execute(new PlantLinkedSpeciesIdValueObject(ID)),
    ).resolves.toBeUndefined();
    expect(speciesPort.findByPlantSpeciesId).toHaveBeenCalledWith(ID);
  });

  it('throws PlantLinkedSpeciesNotFoundException when the species is missing', async () => {
    speciesPort.findByPlantSpeciesId.mockResolvedValue(null);

    await expect(
      service.execute(new PlantLinkedSpeciesIdValueObject(ID)),
    ).rejects.toThrow(PlantLinkedSpeciesNotFoundException);
  });
});
