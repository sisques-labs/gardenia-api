import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import { IPlantingSpotWriteRepository } from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotStatusValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-status/planting-spot-status.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

import { AssertPlantingSpotExistsService } from './assert-planting-spot-exists.service';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildAggregate = (): PlantingSpotAggregate =>
  new PlantingSpotAggregate({
    id: new PlantingSpotIdValueObject(SPOT_ID),
    name: new PlantingSpotNameValueObject('Bancal Norte'),
    type: new PlantingSpotTypeValueObject(PlantingSpotTypeEnum.RAISED_BED),
    description: null,
    capacity: null,
    row: null,
    column: null,
    dimensions: null,
    soilType: null,
    status: new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.ACTIVE),
    fallowSince: null,
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('AssertPlantingSpotExistsService', () => {
  let service: AssertPlantingSpotExistsService;
  let writeRepository: jest.Mocked<IPlantingSpotWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantingSpotWriteRepository>;

    service = new AssertPlantingSpotExistsService(writeRepository);
  });

  describe('spot exists', () => {
    it('should return the aggregate when found', async () => {
      const aggregate = buildAggregate();
      writeRepository.findById.mockResolvedValue(aggregate);

      const result = await service.execute(
        new PlantingSpotIdValueObject(SPOT_ID),
      );

      expect(result).toBe(aggregate);
      expect(writeRepository.findById).toHaveBeenCalledWith(SPOT_ID);
    });
  });

  describe('spot does not exist', () => {
    it('should throw PlantingSpotNotFoundException when not found', async () => {
      writeRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute(new PlantingSpotIdValueObject(SPOT_ID)),
      ).rejects.toThrow(PlantingSpotNotFoundException);
    });

    it('should include the spot id in the thrown exception', async () => {
      writeRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute(new PlantingSpotIdValueObject(SPOT_ID)),
      ).rejects.toThrow(SPOT_ID);
    });
  });
});
