import { CommandBus } from '@nestjs/cqrs';

import { DeleteQrCommand } from '@contexts/qr/application/commands/delete-qr/delete-qr.command';
import { QrDeleteMcpTool } from './qr-delete.tool';

const QR_ID = '11111111-1111-4111-8111-111111111111';

describe('QrDeleteMcpTool', () => {
  let tool: QrDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new QrDeleteMcpTool(commandBus);
  });

  it('dispatches DeleteQrCommand and returns success', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ qrId: QR_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteQrCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as DeleteQrCommand;
    expect(command.qrId.value).toBe(QR_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: QR_ID }),
    });
  });
});
