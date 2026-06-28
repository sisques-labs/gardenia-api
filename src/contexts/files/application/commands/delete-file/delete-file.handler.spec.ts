import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IFileStoragePort } from '@contexts/files/application/ports/file-storage.port';
import { AssertFileExistsService } from '@contexts/files/application/services/write/assert-file-exists/assert-file-exists.service';
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
import { DeleteFileCommand } from './delete-file.command';
import { DeleteFileCommandHandler } from './delete-file.handler';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';

function buildFile(): FileAggregate {
  return new FileAggregate({
    id: new FileIdValueObject(FILE_ID),
    filename: new FileNameValueObject('rose.png'),
    mimeType: new FileMimeTypeValueObject(FileMimeTypeEnum.IMAGE_PNG),
    size: new FileSizeValueObject(1024),
    storageKey: new FileStorageKeyValueObject(FILE_ID),
    url: new FileUrlValueObject(`/api/files/${FILE_ID}/content`),
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('DeleteFileCommandHandler', () => {
  let handler: DeleteFileCommandHandler;
  let mockWriteRepo: jest.Mocked<IFileWriteRepository>;
  let mockStoragePort: jest.Mocked<IFileStoragePort>;
  let mockAssert: jest.Mocked<AssertFileExistsService>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IFileWriteRepository>;

    mockStoragePort = {
      save: jest.fn(),
      read: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      resolveUrl: jest.fn(),
    };

    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertFileExistsService>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeleteFileCommandHandler(
      mockWriteRepo,
      mockStoragePort,
      mockAssert,
      mockEventBus,
    );
  });

  it('deletes bytes via the port and metadata via the repo', async () => {
    mockAssert.execute.mockResolvedValue(buildFile());

    await handler.execute(new DeleteFileCommand({ id: FILE_ID }));

    expect(mockStoragePort.delete).toHaveBeenCalledWith(FILE_ID);
    expect(mockWriteRepo.delete).toHaveBeenCalledWith(FILE_ID);
  });

  it('propagates FileNotFoundException when the file does not exist', async () => {
    mockAssert.execute.mockRejectedValue(new FileNotFoundException(FILE_ID));

    await expect(
      handler.execute(new DeleteFileCommand({ id: FILE_ID })),
    ).rejects.toThrow(FileNotFoundException);
    expect(mockStoragePort.delete).not.toHaveBeenCalled();
  });
});
