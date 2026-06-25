import { AssertFileViewModelExistsService } from '@contexts/files/application/services/read/assert-file-view-model-exists/assert-file-view-model-exists.service';
import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileFindByIdQuery } from './file-find-by-id.query';
import { FileFindByIdQueryHandler } from './file-find-by-id.handler';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('FileFindByIdQueryHandler', () => {
  let handler: FileFindByIdQueryHandler;
  let mockAssert: jest.Mocked<AssertFileViewModelExistsService>;

  beforeEach(() => {
    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertFileViewModelExistsService>;
    handler = new FileFindByIdQueryHandler(mockAssert);
  });

  it('returns the view model when it exists', async () => {
    const vm = {} as FileViewModel;
    mockAssert.execute.mockResolvedValue(vm);

    const result = await handler.execute(
      new FileFindByIdQuery({ id: FILE_ID }),
    );

    expect(result).toBe(vm);
  });

  it('propagates FileNotFoundException when it does not exist', async () => {
    mockAssert.execute.mockRejectedValue(new FileNotFoundException(FILE_ID));

    await expect(
      handler.execute(new FileFindByIdQuery({ id: FILE_ID })),
    ).rejects.toThrow(FileNotFoundException);
  });
});
