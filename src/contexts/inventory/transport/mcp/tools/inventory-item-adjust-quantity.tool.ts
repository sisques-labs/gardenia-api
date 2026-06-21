import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { AdjustInventoryItemQuantityCommand } from '@contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.command';
import { inventoryItemAdjustQuantitySchema } from '../schemas/inventory-item-adjust-quantity.schema';

@McpTool()
@Injectable()
export class InventoryItemAdjustQuantityMcpTool implements IMcpTool {
  private readonly logger = new Logger(InventoryItemAdjustQuantityMcpTool.name);

  readonly name = 'inventory_item_adjust_quantity';
  readonly title = 'Adjust inventory item quantity';
  readonly description =
    'Applies a signed delta to an inventory item stock with a reason.';
  readonly inputSchema = inventoryItemAdjustQuantitySchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id, delta, reason } = args as {
      id: string;
      delta: number;
      reason: string;
    };
    this.logger.log(`Adjusting inventory item ${id} by ${delta}`);

    await this.commandBus.execute(
      new AdjustInventoryItemQuantityCommand({ id, delta, reason }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
