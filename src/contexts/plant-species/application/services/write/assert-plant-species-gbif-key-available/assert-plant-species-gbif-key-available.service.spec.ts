import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesGbifKeyAlreadyExistsException } from '@contexts/plant-species/domain/exceptions/plant-species-gbif-key-already-exists.exception';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { AssertPlantSpeciesGbifKeyAvailableService } from './assert-plant-species-gbif-key-available.service';

const EXISTING_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('AssertPlantSpeciesGbifKeyAvailableService', () => {
  let service: AssertPlantSpeciesGbifKeyAvailableService;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    writeRepository = {
      findById: jest.fn(),
      findByGbifKey: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IPlantSpeciesWriteRepository>;
    service = new AssertPlantSpeciesGbifKeyAvailableService(writeRepository);
  });

  it('does not throw when no entry has the gbifKey', async () => {
    writeRepository.findByGbifKey.mockResolvedValue(null);

    await expect(
      service.execute(new PlantSpeciesGbifKeyValueObject(2882337)),
    ).resolves.toBeUndefined();
  });

  it('throws when another entry already has the gbifKey', async () => {
    writeRepository.findByGbifKey.mockResolvedValue({
      id: { value: EXISTING_ID },
    } as PlantSpeciesAggregate);

    await expect(
      service.execute(new PlantSpeciesGbifKeyValueObject(2882337)),
    ).rejects.toThrow(PlantSpeciesGbifKeyAlreadyExistsException);
  });

  it('does not throw when the match is the excluded id (update path)', async () => {
    writeRepository.findByGbifKey.mockResolvedValue({
      id: { value: EXISTING_ID },
    } as PlantSpeciesAggregate);

    await expect(
      service.execute(new PlantSpeciesGbifKeyValueObject(2882337), EXISTING_ID),
    ).resolves.toBeUndefined();
  });

  it('throws when the match is a different id than the excluded one', async () => {
    writeRepository.findByGbifKey.mockResolvedValue({
      id: { value: EXISTING_ID },
    } as PlantSpeciesAggregate);

    await expect(
      service.execute(new PlantSpeciesGbifKeyValueObject(2882337), OTHER_ID),
    ).rejects.toThrow(PlantSpeciesGbifKeyAlreadyExistsException);
  });
});
