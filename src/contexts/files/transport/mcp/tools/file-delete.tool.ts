import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { fileDeleteSchema } from '../schemas/file-delete.schema';

@McpTool()
@Injectable()
export class FileDeleteMcpTool implements IMcpTool {
  private readonly logger = new Logger(FileDeleteMcpTool.name);

  readonly name = 'file_delete';
  readonly title = 'Delete file';
  readonly description = 'Deletes a file from the current space.';
  readonly inputSchema = fileDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting file: ${id}`);

    await this.commandBus.execute(new DeleteFileCommand({ id }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
