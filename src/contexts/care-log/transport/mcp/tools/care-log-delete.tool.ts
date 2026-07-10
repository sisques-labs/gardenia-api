import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { DeleteCareLogEntryCommand } from '@contexts/care-log/application/commands/delete-care-log-entry/delete-care-log-entry.command';
import { careLogDeleteSchema } from '../schemas/care-log-delete.schema';

@McpTool()
@Injectable()
export class CareLogDeleteMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(CareLogDeleteMcpTool.name);

  readonly name = 'care_log_delete';
  readonly title = 'Delete care log entry';
  readonly description = 'Deletes a care log entry from the current space.';
  readonly inputSchema = careLogDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting care log entry: ${id}`);

    await this.commandBus.execute(
      new DeleteCareLogEntryCommand({ id, requestingUserId: context.userId }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
