import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/interfaces/mcp-tool.interface';
import { UpdateInventoryItemCommand } from '@contexts/inventory/application/commands/update-inventory-item/update-inventory-item.command';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { inventoryItemUpdateSchema } from '../schemas/inventory-item-update.schema';

/** Converts an optional/nullable ISO date string into Date | null | undefined. */
function toOptionalDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

@McpTool()
@Injectable()
export class InventoryItemUpdateTool implements IMcpTool {
  private readonly logger = new Logger(InventoryItemUpdateTool.name);

  readonly name = 'inventory_item_update';
  readonly title = 'Update inventory item';
  readonly description =
    'Updates an inventory item. Only provided fields are changed. Use the adjust-quantity tool to change stock.';
  readonly inputSchema = inventoryItemUpdateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const {
      id,
      itemType,
      name,
      brand,
      notes,
      unit,
      lowStockThreshold,
      acquiredAt,
      expiresAt,
    } = args as {
      id: string;
      itemType?: InventoryItemTypeEnum;
      name?: string;
      brand?: string | null;
      notes?: string | null;
      unit?: InventoryUnitEnum;
      lowStockThreshold?: number | null;
      acquiredAt?: string | null;
      expiresAt?: string | null;
    };
    this.logger.log(`Updating inventory item: ${id}`);

    await this.commandBus.execute(
      new UpdateInventoryItemCommand({
        id,
        itemType,
        name,
        brand,
        notes,
        unit,
        lowStockThreshold,
        acquiredAt: toOptionalDate(acquiredAt),
        expiresAt: toOptionalDate(expiresAt),
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
