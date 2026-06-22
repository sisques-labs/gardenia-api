import { PlantSpeciesNameAlreadyExistsException } from '@contexts/plant-species/domain/exceptions/plant-species-name-already-exists.exception';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';
import { AssertPlantSpeciesNameAvailableService } from './assert-plant-species-name-available.service';

const EXISTING_ID = '550e8400-e29b-41d4-a716-446655440000';
const NAME = 'Monstera deliciosa';

describe('AssertPlantSpeciesNameAvailableService', () => {
  let service: AssertPlantSpeciesNameAvailableService;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    writeRepository = {
      findById: jest.fn(),
      findByScientificName: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IPlantSpeciesWriteRepository>;
    service = new AssertPlantSpeciesNameAvailableService(writeRepository);
  });

  it('resolves when no species with that name exists', async () => {
    writeRepository.findByScientificName.mockResolvedValue(null);

    await expect(
      service.execute(new PlantSpeciesScientificNameValueObject(NAME)),
    ).resolves.toBeUndefined();
  });

  it('queries the repository with the lowercased name', async () => {
    writeRepository.findByScientificName.mockResolvedValue(null);

    await service.execute(new PlantSpeciesScientificNameValueObject(NAME));

    expect(writeRepository.findByScientificName).toHaveBeenCalledWith(
      NAME.toLowerCase(),
    );
  });

  it('throws when a different species already uses the name', async () => {
    writeRepository.findByScientificName.mockResolvedValue({
      id: { value: EXISTING_ID },
    } as never);

    await expect(
      service.execute(new PlantSpeciesScientificNameValueObject(NAME)),
    ).rejects.toThrow(PlantSpeciesNameAlreadyExistsException);
  });

  it('resolves when the matching species is the excluded one (update)', async () => {
    writeRepository.findByScientificName.mockResolvedValue({
      id: { value: EXISTING_ID },
    } as never);

    await expect(
      service.execute(
        new PlantSpeciesScientificNameValueObject(NAME),
        EXISTING_ID,
      ),
    ).resolves.toBeUndefined();
  });
});
