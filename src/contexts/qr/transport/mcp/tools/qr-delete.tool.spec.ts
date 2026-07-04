import { CommandBus } from '@nestjs/cqrs';

import { DeleteQrCommand } from '@contexts/qr/application/commands/delete-qr/delete-qr.command';
import { QrDeleteMcpTool } from './qr-delete.tool';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('QrDeleteMcpTool', () => {
  let tool: QrDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new QrDeleteMcpTool(commandBus);
  });

  it('dispatches DeleteQrCommand', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ qrId: QR_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteQrCommand),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: QR_ID }),
    });
  });
});
