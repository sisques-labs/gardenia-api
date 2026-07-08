import { CommandBus } from '@nestjs/cqrs';

import { UploadFileCommand } from '@contexts/files/application/commands/upload-file/upload-file.command';
import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { FilesAdapter } from './files.adapter';

const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('FilesAdapter', () => {
  let commandBus: jest.Mocked<CommandBus>;
  let adapter: FilesAdapter;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    adapter = new FilesAdapter(commandBus);
  });

  it('uploadFile() dispatches UploadFileCommand and returns the result', async () => {
    commandBus.execute.mockResolvedValue({ id: FILE_ID, url: '/x' });

    const result = await adapter.uploadFile({
      filename: 'rose.png',
      mimeType: 'image/png',
      size: 100,
      content: Buffer.from('x'),
      userId: USER_ID,
      spaceId: SPACE_ID,
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UploadFileCommand),
    );
    expect(result).toEqual({ id: FILE_ID, url: '/x' });
  });

  it('deleteFile() dispatches DeleteFileCommand', async () => {
    await adapter.deleteFile(FILE_ID);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteFileCommand),
    );
  });
});
