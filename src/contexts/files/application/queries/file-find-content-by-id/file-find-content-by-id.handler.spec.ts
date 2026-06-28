import { IFileStoragePort } from '@contexts/files/application/ports/file-storage.port';
import { AssertFileViewModelExistsService } from '@contexts/files/application/services/read/assert-file-view-model-exists/assert-file-view-model-exists.service';
import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileFindContentByIdQuery } from './file-find-content-by-id.query';
import { FileFindContentByIdQueryHandler } from './file-find-content-by-id.handler';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';

function viewModel(): FileViewModel {
  return {
    id: FILE_ID,
    filename: 'rose.png',
    mimeType: 'image/png',
    size: 1024,
    storageKey: FILE_ID,
    url: `/api/files/${FILE_ID}/content`,
    userId: 'u',
    spaceId: 's',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FileViewModel;
}

describe('FileFindContentByIdQueryHandler', () => {
  let handler: FileFindContentByIdQueryHandler;
  let mockAssert: jest.Mocked<AssertFileViewModelExistsService>;
  let mockStoragePort: jest.Mocked<IFileStoragePort>;

  beforeEach(() => {
    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertFileViewModelExistsService>;
    mockStoragePort = {
      save: jest.fn(),
      read: jest.fn(),
      delete: jest.fn(),
      resolveUrl: jest.fn(),
    };
    handler = new FileFindContentByIdQueryHandler(mockAssert, mockStoragePort);
  });

  it('returns the bytes plus headers metadata', async () => {
    mockAssert.execute.mockResolvedValue(viewModel());
    mockStoragePort.read.mockResolvedValue(Buffer.from('binary'));

    const result = await handler.execute(
      new FileFindContentByIdQuery({ id: FILE_ID }),
    );

    expect(mockStoragePort.read).toHaveBeenCalledWith(FILE_ID);
    expect(result.bytes.toString()).toBe('binary');
    expect(result.mimeType).toBe('image/png');
    expect(result.filename).toBe('rose.png');
  });

  it('throws FileNotFoundException when the bytes are missing', async () => {
    mockAssert.execute.mockResolvedValue(viewModel());
    mockStoragePort.read.mockResolvedValue(null);

    await expect(
      handler.execute(new FileFindContentByIdQuery({ id: FILE_ID })),
    ).rejects.toThrow(FileNotFoundException);
  });
});
