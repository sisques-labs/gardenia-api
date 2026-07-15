import {
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationNotFoundException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-found.exception';
import { IPlantIdentificationWriteRepository } from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';
import { AssertPlantIdentificationExistsService } from './assert-plant-identification-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildIdentification(): PlantIdentificationAggregate {
  return new PlantIdentificationAggregate({
    id: new PlantIdentificationIdValueObject(ID),
    requestedByUserId: new UuidValueObject(
      '660e8400-e29b-41d4-a716-446655440001',
    ),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    status: new PlantIdentificationStatusValueObject(
      PlantIdentificationStatusEnum.RESOLVED,
    ),
    resolvedGbifKey: new NumberValueObject(2882337),
    resolvedScientificName: new StringValueObject('Monstera deliciosa'),
    convertedToPlantId: null,
    photos: [],
    candidates: [],
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('AssertPlantIdentificationExistsService', () => {
  let mockWriteRepo: jest.Mocked<IPlantIdentificationWriteRepository>;
  let service: AssertPlantIdentificationExistsService;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    };
    service = new AssertPlantIdentificationExistsService(mockWriteRepo);
  });

  it('returns the aggregate when found', async () => {
    const identification = buildIdentification();
    mockWriteRepo.findById.mockResolvedValue(identification);

    const result = await service.execute(
      new PlantIdentificationIdValueObject(ID),
    );

    expect(result).toBe(identification);
  });

  it('throws PlantIdentificationNotFoundException when not found', async () => {
    mockWriteRepo.findById.mockResolvedValue(null);

    await expect(
      service.execute(new PlantIdentificationIdValueObject(ID)),
    ).rejects.toThrow(PlantIdentificationNotFoundException);
  });
});
