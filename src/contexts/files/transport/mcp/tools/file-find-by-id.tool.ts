import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { FileFindByIdQuery } from '@contexts/files/application/queries/file-find-by-id/file-find-by-id.query';
import { fileFindByIdSchema } from '../schemas/file-find-by-id.schema';

@McpTool()
@Injectable()
export class FileFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(FileFindByIdMcpTool.name);

  readonly name = 'file_find_by_id';
  readonly title = 'Find file by id';
  readonly description =
    'Returns a single file metadata record by its id, or null if it does not exist.';
  readonly inputSchema = fileFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding file by id: ${id}`);

    const result = await this.queryBus.execute(new FileFindByIdQuery({ id }));

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
