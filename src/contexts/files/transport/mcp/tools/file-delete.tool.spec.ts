import { CommandBus } from '@nestjs/cqrs';

import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { FileDeleteMcpTool } from './file-delete.tool';

const FILE_ID = '11111111-1111-4111-8111-111111111111';

describe('FileDeleteMcpTool', () => {
  let tool: FileDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new FileDeleteMcpTool(commandBus);
  });

  it('dispatches DeleteFileCommand with the given id', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: FILE_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteFileCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as DeleteFileCommand;
    expect(command.id.value).toBe(FILE_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: FILE_ID }),
    });
  });
});
