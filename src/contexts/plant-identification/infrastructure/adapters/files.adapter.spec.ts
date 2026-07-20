import { CommandBus } from '@nestjs/cqrs';
import {
  FilenameValueObject,
  MimeTypeValueObject,
  NumberValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { UploadFileCommand } from '@contexts/files/application/commands/upload-file/upload-file.command';
import { FilesAdapter } from './files.adapter';

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
    commandBus.execute.mockResolvedValue({ id: 'file-1', url: '/x' });

    const result = await adapter.uploadFile({
      filename: new FilenameValueObject('leaf.png'),
      mimeType: new MimeTypeValueObject('image/png'),
      size: new NumberValueObject(100),
      content: Buffer.from('x'),
      userId: new UuidValueObject(USER_ID),
      spaceId: new UuidValueObject(SPACE_ID),
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UploadFileCommand),
    );
    expect(result).toEqual({ id: 'file-1', url: '/x' });
  });
});
