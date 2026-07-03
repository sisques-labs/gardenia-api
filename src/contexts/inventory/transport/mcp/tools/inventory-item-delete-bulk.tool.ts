import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { DeleteInventoryItemsBulkCommand } from '@contexts/inventory/application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.command';
import { DeleteInventoryItemsBulkResult } from '@contexts/inventory/application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.handler';
import { inventoryItemDeleteBulkSchema } from '../schemas/inventory-item-delete-bulk.schema';

@McpTool()
@Injectable()
export class InventoryItemDeleteBulkMcpTool implements IMcpTool {
  private readonly logger = new Logger(InventoryItemDeleteBulkMcpTool.name);

  readonly name = 'inventory_item_delete_bulk';
  readonly title = 'Bulk delete inventory items';
  readonly description =
    'Deletes multiple inventory items from the current space in one call.';
  readonly inputSchema = inventoryItemDeleteBulkSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { ids } = args as { ids: string[] };
    this.logger.log(`Bulk deleting ${ids.length} inventory items`);

    const result = await this.commandBus.execute<
      DeleteInventoryItemsBulkCommand,
      DeleteInventoryItemsBulkResult
    >(new DeleteInventoryItemsBulkCommand({ ids }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            deletedIds: result.deletedIds,
            notFoundIds: result.notFoundIds,
            deletedCount: result.deletedIds.length,
            requestedCount:
              result.deletedIds.length + result.notFoundIds.length,
          }),
        },
      ],
    };
  }
}
