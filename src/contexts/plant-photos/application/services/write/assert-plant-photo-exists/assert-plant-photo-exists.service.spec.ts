import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoNotFoundException } from '@contexts/plant-photos/domain/exceptions/plant-photo-not-found.exception';
import { IPlantPhotoWriteRepository } from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { AssertPlantPhotoExistsService } from './assert-plant-photo-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertPlantPhotoExistsService', () => {
  let writeRepository: jest.Mocked<IPlantPhotoWriteRepository>;
  let service: AssertPlantPhotoExistsService;

  beforeEach(() => {
    writeRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantPhotoWriteRepository>;
    service = new AssertPlantPhotoExistsService(writeRepository);
  });

  it('returns the aggregate when found', async () => {
    const aggregate = {} as PlantPhotoAggregate;
    writeRepository.findById.mockResolvedValue(aggregate);

    const result = await service.execute(new PlantPhotoIdValueObject(ID));

    expect(result).toBe(aggregate);
  });

  it('throws PlantPhotoNotFoundException when not found', async () => {
    writeRepository.findById.mockResolvedValue(null);

    await expect(
      service.execute(new PlantPhotoIdValueObject(ID)),
    ).rejects.toThrow(PlantPhotoNotFoundException);
  });
});
