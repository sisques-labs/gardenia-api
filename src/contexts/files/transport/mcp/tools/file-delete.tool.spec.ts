import { CommandBus } from '@nestjs/cqrs';

import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { FileDeleteMcpTool } from './file-delete.tool';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('FileDeleteMcpTool', () => {
  let tool: FileDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new FileDeleteMcpTool(commandBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('file_delete');
    expect(tool.inputSchema).toHaveProperty('id');
  });

  it('dispatches DeleteFileCommand and serializes a success result', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: FILE_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteFileCommand),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: FILE_ID }),
    });
  });
});
