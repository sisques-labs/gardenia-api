import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import { IPlantWriteRepository } from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';

import { AssertPlantExistsService } from './assert-plant-exists.service';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildAggregate = (): PlantAggregate =>
  new PlantAggregate({
    id: new PlantIdValueObject(PLANT_ID),
    name: new PlantNameValueObject('Rose'),
    plantSpeciesId: null,
    imageUrl: null,
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    qrId: null,
    plantingSpotId: null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('AssertPlantExistsService', () => {
  let service: AssertPlantExistsService;
  let writeRepository: jest.Mocked<IPlantWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantWriteRepository>;

    service = new AssertPlantExistsService(writeRepository);
  });

  describe('plant exists', () => {
    it('should return the aggregate when found', async () => {
      const aggregate = buildAggregate();
      const id = new PlantIdValueObject(PLANT_ID);
      writeRepository.findById.mockResolvedValue(aggregate);

      const result = await service.execute(id);

      expect(result).toBe(aggregate);
      expect(writeRepository.findById).toHaveBeenCalledWith(id.value);
    });
  });

  describe('plant does not exist', () => {
    it('should throw PlantNotFoundException when not found', async () => {
      const id = new PlantIdValueObject(PLANT_ID);
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(PlantNotFoundException);
    });

    it('should include the plant id in the thrown exception', async () => {
      const id = new PlantIdValueObject(PLANT_ID);
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(PLANT_ID);
    });
  });
});
