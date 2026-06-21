import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { RegenerateQrCommand } from '@contexts/qr/application/commands/regenerate-qr/regenerate-qr.command';
import { qrRegenerateSchema } from '../schemas/qr-regenerate.schema';

@McpTool()
@Injectable()
export class QrRegenerateMcpTool implements IMcpTool {
  private readonly logger = new Logger(QrRegenerateMcpTool.name);

  readonly name = 'qr_regenerate';
  readonly title = 'Regenerate QR code';
  readonly description = 'Regenerates an existing QR code.';
  readonly inputSchema = qrRegenerateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { qrId } = args as { qrId: string };
    this.logger.log(`Regenerating QR: ${qrId}`);

    await this.commandBus.execute(new RegenerateQrCommand({ qrId }));

    return {
      content: [
        { type: 'text', text: JSON.stringify({ success: true, id: qrId }) },
      ],
    };
  }
}
