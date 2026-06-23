import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { CreateInventoryItemCommand } from '@contexts/inventory/application/commands/create-inventory-item/create-inventory-item.command';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { inventoryItemCreateSchema } from '../schemas/inventory-item-create.schema';

@McpTool()
@Injectable()
export class InventoryItemCreateMcpTool implements IMcpTool {
  private readonly logger = new Logger(InventoryItemCreateMcpTool.name);

  readonly name = 'inventory_item_create';
  readonly title = 'Create inventory item';
  readonly description = 'Creates an inventory item in the current space.';
  readonly inputSchema = inventoryItemCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const {
      itemType,
      name,
      quantity,
      unit,
      brand,
      notes,
      lowStockThreshold,
      acquiredAt,
      expiresAt,
    } = args as {
      itemType: InventoryItemTypeEnum;
      name: string;
      quantity: number;
      unit: InventoryUnitEnum;
      brand?: string | null;
      notes?: string | null;
      lowStockThreshold?: number | null;
      acquiredAt?: string | null;
      expiresAt?: string | null;
    };
    this.logger.log(`Creating inventory item for user: ${context.userId}`);

    const id = await this.commandBus.execute<
      CreateInventoryItemCommand,
      string
    >(
      new CreateInventoryItemCommand({
        itemType,
        name,
        quantity,
        unit,
        brand,
        notes,
        lowStockThreshold,
        acquiredAt: acquiredAt ? new Date(acquiredAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        userId: context.userId,
        spaceId: context.spaceId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
