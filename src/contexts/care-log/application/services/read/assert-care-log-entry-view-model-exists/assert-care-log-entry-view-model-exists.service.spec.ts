import { CareLogEntryNotFoundException } from '@contexts/care-log/domain/exceptions/care-log-entry-not-found.exception';
import { ICareLogEntryReadRepository } from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { AssertCareLogEntryViewModelExistsService } from './assert-care-log-entry-view-model-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertCareLogEntryViewModelExistsService', () => {
  let service: AssertCareLogEntryViewModelExistsService;
  let readRepository: jest.Mocked<ICareLogEntryReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<ICareLogEntryReadRepository>;
    service = new AssertCareLogEntryViewModelExistsService(readRepository);
  });

  it('returns the view model when it exists', async () => {
    const vm = {} as CareLogEntryViewModel;
    readRepository.findById.mockResolvedValue(vm);

    const result = await service.execute(ID);

    expect(result).toBe(vm);
    expect(readRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws CareLogEntryNotFoundException when it does not exist', async () => {
    readRepository.findById.mockResolvedValue(null);

    await expect(service.execute(ID)).rejects.toThrow(
      CareLogEntryNotFoundException,
    );
  });
});
