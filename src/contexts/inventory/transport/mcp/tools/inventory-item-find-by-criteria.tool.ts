import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { inventoryItemFindByCriteriaSchema } from '../schemas/inventory-item-find-by-criteria.schema';

@McpTool()
@Injectable()
export class InventoryItemFindByCriteriaMcpTool implements IMcpTool {
  private readonly logger = new Logger(InventoryItemFindByCriteriaMcpTool.name);

  readonly name = 'inventory_item_find_by_criteria';
  readonly title = 'List inventory items';
  readonly description =
    'Returns a paginated list of inventory items in the current space.';
  readonly inputSchema = inventoryItemFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { page, perPage } = args as { page?: number; perPage?: number };
    this.logger.log(
      `Finding inventory items: page=${page ?? '-'} perPage=${perPage ?? '-'}`,
    );

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;
    const criteria = new Criteria(undefined, undefined, pagination);

    const result = await this.queryBus.execute(
      new InventoryItemFindByCriteriaQuery(criteria),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
