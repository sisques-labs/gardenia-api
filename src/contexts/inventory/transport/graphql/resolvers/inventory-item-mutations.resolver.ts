import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
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
import { AdjustInventoryItemQuantityGraphQLDto } from '@contexts/inventory/transport/graphql/dtos/requests/adjust-inventory-item-quantity-graphql.dto';
import { CreateInventoryItemGraphQLDto } from '@contexts/inventory/transport/graphql/dtos/requests/create-inventory-item-graphql.dto';
import { DeleteInventoryItemsBulkGraphQLDto } from '@contexts/inventory/transport/graphql/dtos/requests/delete-inventory-items-bulk-graphql.dto';
import { UpdateInventoryItemGraphQLDto } from '@contexts/inventory/transport/graphql/dtos/requests/update-inventory-item-graphql.dto';
import { BulkDeleteResultDto } from '@contexts/inventory/transport/graphql/dtos/responses/bulk-delete-result.response.dto';
import { SpaceContext } from '@shared/space-context/space-context.service';

@UseGuards(JwtAuthGuard)
@Resolver()
export class InventoryItemMutationsResolver {
  private readonly logger = new Logger(InventoryItemMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
    private readonly spaceContext: SpaceContext,
  ) {}

  @Mutation(() => MutationResponseDto)
  async inventoryItemCreate(
    @Args('input') input: CreateInventoryItemGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating inventory item for user: ${user.userId}`);

    const spaceId = this.spaceContext.require();
    const inventoryItemId = await this.commandBus.execute<
      CreateInventoryItemCommand,
      string
    >(
      new CreateInventoryItemCommand({
        itemType: input.itemType,
        name: input.name,
        brand: input.brand,
        notes: input.notes,
        quantity: input.quantity,
        unit: input.unit,
        lowStockThreshold: input.lowStockThreshold,
        acquiredAt: input.acquiredAt,
        expiresAt: input.expiresAt,
        userId: user.userId,
        spaceId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Inventory item created successfully',
      id: inventoryItemId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async inventoryItemUpdate(
    @Args('input') input: UpdateInventoryItemGraphQLDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating inventory item ${input.id}`);

    await this.commandBus.execute(
      new UpdateInventoryItemCommand({
        id: input.id,
        itemType: input.itemType,
        name: input.name,
        brand: input.brand,
        notes: input.notes,
        unit: input.unit,
        lowStockThreshold: input.lowStockThreshold,
        acquiredAt: input.acquiredAt,
        expiresAt: input.expiresAt,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Inventory item updated successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async inventoryItemAdjustQuantity(
    @Args('input') input: AdjustInventoryItemQuantityGraphQLDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Adjusting inventory item quantity ${input.id}`);

    await this.commandBus.execute(
      new AdjustInventoryItemQuantityCommand({
        id: input.id,
        delta: input.delta,
        reason: input.reason,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Inventory item quantity adjusted successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async inventoryItemDelete(
    @Args('id') id: string,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting inventory item ${id}`);

    await this.commandBus.execute(new DeleteInventoryItemCommand({ id }));

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Inventory item deleted successfully',
      id,
    });
  }

  @Mutation(() => BulkDeleteResultDto)
  async inventoryItemsDeleteBulk(
    @Args('input') input: DeleteInventoryItemsBulkGraphQLDto,
  ): Promise<BulkDeleteResultDto> {
    this.logger.log(`Bulk deleting ${input.ids.length} inventory items`);

    const result = await this.commandBus.execute<
      DeleteInventoryItemsBulkCommand,
      DeleteInventoryItemsBulkResult
    >(new DeleteInventoryItemsBulkCommand({ ids: input.ids }));

    return {
      deletedIds: result.deletedIds,
      notFoundIds: result.notFoundIds,
      deletedCount: result.deletedIds.length,
      requestedCount: result.deletedIds.length + result.notFoundIds.length,
    };
  }
}
