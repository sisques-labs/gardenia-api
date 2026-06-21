import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { InventoryItemFindByIdQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.query';
import { inventoryItemFindByIdSchema } from '../schemas/inventory-item-find-by-id.schema';

@McpTool()
@Injectable()
export class InventoryItemFindByIdMcpTool implements IMcpTool {
  private readonly logger = new Logger(InventoryItemFindByIdMcpTool.name);

  readonly name = 'inventory_item_find_by_id';
  readonly title = 'Find inventory item by id';
  readonly description =
    'Returns a single inventory item by its id, or null if it does not exist.';
  readonly inputSchema = inventoryItemFindByIdSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Finding inventory item by id: ${id}`);

    const result = await this.queryBus.execute(
      new InventoryItemFindByIdQuery({ id }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? null) }],
    };
  }
}
