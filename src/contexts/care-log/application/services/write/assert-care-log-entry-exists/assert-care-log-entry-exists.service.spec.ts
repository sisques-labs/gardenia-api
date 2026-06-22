import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { CareLogEntryNotFoundException } from '@contexts/care-log/domain/exceptions/care-log-entry-not-found.exception';
import { ICareLogEntryWriteRepository } from '@contexts/care-log/domain/repositories/write/care-log-entry-write.repository';
import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';
import { AssertCareLogEntryExistsService } from './assert-care-log-entry-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertCareLogEntryExistsService', () => {
  let service: AssertCareLogEntryExistsService;
  let writeRepository: jest.Mocked<ICareLogEntryWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    writeRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<ICareLogEntryWriteRepository>;
    service = new AssertCareLogEntryExistsService(writeRepository);
  });

  it('returns the aggregate when it exists', async () => {
    const aggregate = {} as CareLogEntryAggregate;
    writeRepository.findById.mockResolvedValue(aggregate);

    const result = await service.execute(new CareLogIdValueObject(ID));

    expect(result).toBe(aggregate);
    expect(writeRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws CareLogEntryNotFoundException when it does not exist', async () => {
    writeRepository.findById.mockResolvedValue(null);

    await expect(service.execute(new CareLogIdValueObject(ID))).rejects.toThrow(
      CareLogEntryNotFoundException,
    );
  });
});
