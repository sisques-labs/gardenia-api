import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { DeleteInventoryItemCommand } from '@contexts/inventory/application/commands/delete-inventory-item/delete-inventory-item.command';
import { inventoryItemDeleteSchema } from '../schemas/inventory-item-delete.schema';

@McpTool()
@Injectable()
export class InventoryItemDeleteTool implements IMcpTool {
  private readonly logger = new Logger(InventoryItemDeleteTool.name);

  readonly name = 'inventory_item_delete';
  readonly title = 'Delete inventory item';
  readonly description = 'Deletes an inventory item from the current space.';
  readonly inputSchema = inventoryItemDeleteSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Deleting inventory item: ${id}`);

    await this.commandBus.execute(new DeleteInventoryItemCommand({ id }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
