import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CreateQrCommand } from '@contexts/qr/application/commands/create-qr/create-qr.command';
import { qrCreateSchema } from '../schemas/qr-create.schema';

@McpTool()
@Injectable()
export class QrCreateMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(QrCreateMcpTool.name);

  readonly name = 'qr_create';
  readonly title = 'Create QR code';
  readonly description = 'Creates a QR code in the current space.';
  readonly inputSchema = qrCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { targetUrl, expiresAt } = args as {
      targetUrl: string;
      expiresAt?: string;
    };
    this.logger.log(`Creating QR for space: ${context.spaceId}`);

    const id = await this.commandBus.execute<CreateQrCommand, string>(
      new CreateQrCommand({
        targetUrl,
        spaceId: context.spaceId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
