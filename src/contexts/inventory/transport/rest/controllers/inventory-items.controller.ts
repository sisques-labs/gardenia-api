import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Criteria,
  Filter,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { AdjustInventoryItemQuantityCommand } from '@contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.command';
import { CreateInventoryItemCommand } from '@contexts/inventory/application/commands/create-inventory-item/create-inventory-item.command';
import { DeleteInventoryItemCommand } from '@contexts/inventory/application/commands/delete-inventory-item/delete-inventory-item.command';
import { DeleteInventoryItemsBulkCommand } from '@contexts/inventory/application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.command';
import { DeleteInventoryItemsBulkResult } from '@contexts/inventory/application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.handler';
import { UpdateInventoryItemCommand } from '@contexts/inventory/application/commands/update-inventory-item/update-inventory-item.command';
import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { InventoryItemFindByIdQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.query';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { AdjustInventoryItemQuantityDto } from '../dtos/adjust-inventory-item-quantity.dto';
import { BulkDeleteResultRestResponseDto } from '../dtos/bulk-delete-result-rest-response.dto';
import { CreateInventoryItemDto } from '../dtos/create-inventory-item.dto';
import { DeleteInventoryItemsBulkDto } from '../dtos/delete-inventory-items-bulk.dto';
import { InventoryItemRestResponseDto } from '../dtos/inventory-item-rest-response.dto';
import { UpdateInventoryItemDto } from '../dtos/update-inventory-item.dto';
import { InventoryItemRestMapper } from '../mappers/inventory-item/inventory-item.mapper';

@ApiTags('inventory-items')
@ApiBearerAuth()
@Controller('inventory-items')
@UseGuards(JwtAuthGuard)
export class InventoryItemsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly inventoryItemRestMapper: InventoryItemRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 201, type: InventoryItemRestResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing X-Space-ID',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createInventoryItem(
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<InventoryItemRestResponseDto> {
    const inventoryItemId = await this.commandBus.execute<
      CreateInventoryItemCommand,
      string
    >(
      new CreateInventoryItemCommand({
        itemType: dto.itemType,
        name: dto.name,
        brand: dto.brand,
        notes: dto.notes,
        quantity: dto.quantity,
        unit: dto.unit,
        lowStockThreshold: dto.lowStockThreshold,
        acquiredAt: dto.acquiredAt,
        expiresAt: dto.expiresAt,
        userId: user.userId,
        spaceId,
      }),
    );

    const vm = await this.queryBus.execute<
      InventoryItemFindByIdQuery,
      InventoryItemViewModel
    >(new InventoryItemFindByIdQuery({ id: inventoryItemId }));

    return this.inventoryItemRestMapper.toResponse(vm);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple inventory items in one request' })
  @ApiResponse({ status: 200, type: BulkDeleteResultRestResponseDto })
  @ApiResponse({ status: 400, description: 'Empty batch or more than 100 ids' })
  async inventoryItemsDeleteBulk(
    @Body() dto: DeleteInventoryItemsBulkDto,
  ): Promise<BulkDeleteResultRestResponseDto> {
    const result = await this.commandBus.execute<
      DeleteInventoryItemsBulkCommand,
      DeleteInventoryItemsBulkResult
    >(new DeleteInventoryItemsBulkCommand({ ids: dto.ids }));

    return {
      deletedIds: result.deletedIds,
      notFoundIds: result.notFoundIds,
      deletedCount: result.deletedIds.length,
      requestedCount: result.deletedIds.length + result.notFoundIds.length,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List inventory items in the current space' })
  @ApiResponse({ status: 200 })
  async inventoryItemsFindByCriteria(
    @Query('itemType') itemType?: InventoryItemTypeEnum,
    @Query('name') name?: string,
    @Query('lowStock') lowStock?: string,
    @Query('expiringBefore') expiringBefore?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResult<InventoryItemRestResponseDto>> {
    const filters: Filter[] = [];
    if (itemType)
      filters.push({
        field: 'item_type',
        operator: FilterOperator.EQUALS,
        value: itemType,
      });
    if (name)
      filters.push({
        field: 'name',
        operator: FilterOperator.LIKE,
        value: name,
      });
    if (lowStock === 'true')
      filters.push({
        field: 'low_stock',
        operator: FilterOperator.EQUALS,
        value: true,
      });
    if (expiringBefore)
      filters.push({
        field: 'expires_at',
        operator: FilterOperator.LESS_THAN_OR_EQUAL,
        value: new Date(expiringBefore),
      });

    const pagination =
      page || limit
        ? { page: page ? Number(page) : 1, perPage: limit ? Number(limit) : 20 }
        : undefined;

    const result = await this.queryBus.execute<
      InventoryItemFindByCriteriaQuery,
      PaginatedResult<InventoryItemViewModel>
    >(
      new InventoryItemFindByCriteriaQuery(
        new Criteria(filters, undefined, pagination),
      ),
    );

    return {
      items: result.items.map((vm) =>
        this.inventoryItemRestMapper.toResponse(vm),
      ),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an inventory item by ID' })
  @ApiResponse({ status: 200, type: InventoryItemRestResponseDto })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async inventoryItemFindById(
    @Param('id') id: string,
  ): Promise<InventoryItemRestResponseDto> {
    const vm = await this.queryBus.execute<
      InventoryItemFindByIdQuery,
      InventoryItemViewModel
    >(new InventoryItemFindByIdQuery({ id }));
    return this.inventoryItemRestMapper.toResponse(vm);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiResponse({ status: 200, type: InventoryItemRestResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async updateInventoryItem(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemRestResponseDto> {
    await this.commandBus.execute(
      new UpdateInventoryItemCommand({
        id,
        itemType: dto.itemType,
        name: dto.name,
        brand: dto.brand,
        notes: dto.notes,
        unit: dto.unit,
        lowStockThreshold: dto.lowStockThreshold,
        acquiredAt: dto.acquiredAt,
        expiresAt: dto.expiresAt,
      }),
    );

    const vm = await this.queryBus.execute<
      InventoryItemFindByIdQuery,
      InventoryItemViewModel
    >(new InventoryItemFindByIdQuery({ id }));
    return this.inventoryItemRestMapper.toResponse(vm);
  }

  @Post(':id/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust the quantity of an inventory item' })
  @ApiResponse({ status: 200, type: InventoryItemRestResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async adjustInventoryItemQuantity(
    @Param('id') id: string,
    @Body() dto: AdjustInventoryItemQuantityDto,
  ): Promise<InventoryItemRestResponseDto> {
    await this.commandBus.execute(
      new AdjustInventoryItemQuantityCommand({
        id,
        delta: dto.delta,
        reason: dto.reason,
      }),
    );

    const vm = await this.queryBus.execute<
      InventoryItemFindByIdQuery,
      InventoryItemViewModel
    >(new InventoryItemFindByIdQuery({ id }));
    return this.inventoryItemRestMapper.toResponse(vm);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async deleteInventoryItem(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteInventoryItemCommand({ id }));
    return { success: true };
  }
}
