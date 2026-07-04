import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';
import { IFileWriteRepository } from '@contexts/files/domain/repositories/write/file-write.repository';
import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';
import { FileMimeTypeValueObject } from '@contexts/files/domain/value-objects/file-mime-type/file-mime-type.value-object';
import { FileNameValueObject } from '@contexts/files/domain/value-objects/file-name/file-name.value-object';
import { FileSizeValueObject } from '@contexts/files/domain/value-objects/file-size/file-size.value-object';
import { FileStorageKeyValueObject } from '@contexts/files/domain/value-objects/file-storage-key/file-storage-key.value-object';
import { FileUrlValueObject } from '@contexts/files/domain/value-objects/file-url/file-url.value-object';

import { AssertFileExistsService } from './assert-file-exists.service';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildAggregate = (): FileAggregate =>
  new FileAggregate({
    id: new FileIdValueObject(FILE_ID),
    filename: new FileNameValueObject('rose.png'),
    mimeType: new FileMimeTypeValueObject(FileMimeTypeEnum.IMAGE_PNG),
    size: new FileSizeValueObject(204800),
    storageKey: new FileStorageKeyValueObject(FILE_ID),
    url: new FileUrlValueObject('/api/files/550e8400/content'),
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });

describe('AssertFileExistsService', () => {
  let service: AssertFileExistsService;
  let writeRepository: jest.Mocked<IFileWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IFileWriteRepository>;

    service = new AssertFileExistsService(writeRepository);
  });

  describe('file exists', () => {
    it('should return the aggregate when found', async () => {
      const aggregate = buildAggregate();
      const id = new FileIdValueObject(FILE_ID);
      writeRepository.findById.mockResolvedValue(aggregate);

      const result = await service.execute(id);

      expect(result).toBe(aggregate);
      expect(writeRepository.findById).toHaveBeenCalledWith(id.value);
    });
  });

  describe('file does not exist', () => {
    it('should throw FileNotFoundException when not found', async () => {
      const id = new FileIdValueObject(FILE_ID);
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(FileNotFoundException);
    });

    it('should include the file id in the thrown exception', async () => {
      const id = new FileIdValueObject(FILE_ID);
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(FILE_ID);
    });
  });
});
