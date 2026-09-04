import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesNotFoundException } from '@contexts/plant-species/domain/exceptions/plant-species-not-found.exception';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';

import { AssertPlantSpeciesExistsService } from './assert-plant-species-exists.service';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertPlantSpeciesExistsService', () => {
  let service: AssertPlantSpeciesExistsService;
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
    service = new AssertPlantSpeciesExistsService(writeRepository);
  });

  it('returns the aggregate when it exists', async () => {
    const aggregate = {} as PlantSpeciesAggregate;
    writeRepository.findById.mockResolvedValue(aggregate);

    const result = await service.execute(new UuidValueObject(ID));

    expect(result).toBe(aggregate);
    expect(writeRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws PlantSpeciesNotFoundException when it does not exist', async () => {
    writeRepository.findById.mockResolvedValue(null);

    await expect(service.execute(new UuidValueObject(ID))).rejects.toThrow(
      PlantSpeciesNotFoundException,
    );
  });
});
