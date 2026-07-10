import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { DeleteHarvestCommand } from '@contexts/harvests/application/commands/delete-harvest/delete-harvest.command';
import { harvestDeleteSchema } from '../schemas/harvest-delete.schema';

@McpTool()
@Injectable()
export class HarvestDeleteMcpTool implements IMcpTool {
  private readonly logger = new Logger(HarvestDeleteMcpTool.name);

  readonly name = 'harvest_delete';
  readonly title = 'Delete harvest';
  readonly description = 'Deletes a harvest from the current space.';
  readonly inputSchema = harvestDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting harvest: ${id}`);

    await this.commandBus.execute(new DeleteHarvestCommand({ id }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
