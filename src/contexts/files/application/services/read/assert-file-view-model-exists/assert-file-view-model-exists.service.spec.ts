import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';
import { IFileReadRepository } from '@contexts/files/domain/repositories/read/file-read.repository';
import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';

import { AssertFileViewModelExistsService } from './assert-file-view-model-exists.service';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildViewModel = (): FileViewModel =>
  new FileViewModel({
    id: FILE_ID,
    filename: 'rose.png',
    mimeType: 'image/png',
    size: 204800,
    storageKey: FILE_ID,
    url: '/api/files/550e8400/content',
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('AssertFileViewModelExistsService', () => {
  let service: AssertFileViewModelExistsService;
  let readRepository: jest.Mocked<IFileReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IFileReadRepository>;

    service = new AssertFileViewModelExistsService(readRepository);
  });

  describe('file exists', () => {
    it('should return FileViewModel when found', async () => {
      const viewModel = buildViewModel();
      const id = new FileIdValueObject(FILE_ID);
      readRepository.findById.mockResolvedValue(viewModel);

      const result = await service.execute(id);

      expect(result).toBe(viewModel);
      expect(readRepository.findById).toHaveBeenCalledWith(id.value);
    });
  });

  describe('file does not exist', () => {
    it('should throw FileNotFoundException when not found', async () => {
      const id = new FileIdValueObject(FILE_ID);
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(FileNotFoundException);
    });

    it('should include the file id in the exception message', async () => {
      const id = new FileIdValueObject(FILE_ID);
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(FILE_ID);
    });
  });
});
