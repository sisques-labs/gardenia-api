import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import { HarvestNotFoundException } from '@contexts/harvests/domain/exceptions/harvest-not-found.exception';
import { IHarvestWriteRepository } from '@contexts/harvests/domain/repositories/write/harvest-write.repository';

import { AssertHarvestExistsService } from './assert-harvest-exists.service';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertHarvestExistsService', () => {
  let service: AssertHarvestExistsService;
  let writeRepository: jest.Mocked<IHarvestWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    writeRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IHarvestWriteRepository>;
    service = new AssertHarvestExistsService(writeRepository);
  });

  it('returns the aggregate when it exists', async () => {
    const aggregate = {} as HarvestAggregate;
    writeRepository.findById.mockResolvedValue(aggregate);

    const result = await service.execute(new UuidValueObject(ID));

    expect(result).toBe(aggregate);
    expect(writeRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws HarvestNotFoundException when it does not exist', async () => {
    writeRepository.findById.mockResolvedValue(null);

    await expect(service.execute(new UuidValueObject(ID))).rejects.toThrow(
      HarvestNotFoundException,
    );
  });

  it('includes the id in the thrown exception', async () => {
    writeRepository.findById.mockResolvedValue(null);

    await expect(service.execute(new UuidValueObject(ID))).rejects.toThrow(ID);
  });
});
