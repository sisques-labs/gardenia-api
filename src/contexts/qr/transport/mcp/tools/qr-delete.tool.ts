import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { DeleteQrCommand } from '@contexts/qr/application/commands/delete-qr/delete-qr.command';
import { qrDeleteSchema } from '../schemas/qr-delete.schema';

@McpTool()
@Injectable()
export class QrDeleteTool implements IMcpTool {
  private readonly logger = new Logger(QrDeleteTool.name);

  readonly name = 'qr_delete';
  readonly title = 'Delete QR code';
  readonly description = 'Deletes a QR code from the current space.';
  readonly inputSchema = qrDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { qrId } = args as { qrId: string };
    this.logger.log(`Deleting QR: ${qrId}`);

    await this.commandBus.execute(new DeleteQrCommand({ qrId }));

    return {
      content: [
        { type: 'text', text: JSON.stringify({ success: true, id: qrId }) },
      ],
    };
  }
}
