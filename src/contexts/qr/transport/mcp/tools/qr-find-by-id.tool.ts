import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { qrFindByIdSchema } from '../schemas/qr-find-by-id.schema';

@McpTool()
@Injectable()
export class QrFindByIdTool implements IMcpTool {
  private readonly logger = new Logger(QrFindByIdTool.name);

  readonly name = 'qr_find_by_id';
  readonly title = 'Find QR code by id';
  readonly description =
    'Returns a single QR code by its id, or null if it does not exist.';
  readonly inputSchema = qrFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { qrId } = args as { qrId: string };
    this.logger.log(`Finding QR by id: ${qrId}`);

    const result = await this.queryBus.execute(new QrFindByIdQuery({ qrId }));

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
