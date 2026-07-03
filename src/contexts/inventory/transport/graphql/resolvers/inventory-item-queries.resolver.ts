import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { InventoryItemFindByIdQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.query';
import { inventoryItemFilterableFields } from '@contexts/inventory/transport/graphql/registries/inventory-item-filterable-fields.registry';
import { InventoryItemCriteriaGraphQLDto } from '@contexts/inventory/transport/graphql/dtos/requests/inventory-item-criteria-graphql.dto';
import { InventoryItemFindByIdGraphQLDto } from '@contexts/inventory/transport/graphql/dtos/requests/inventory-item-find-by-id-graphql.dto';
import {
  InventoryItemResponseDto,
  PaginatedInventoryItemsResultDto,
} from '@contexts/inventory/transport/graphql/dtos/responses/inventory-item.response.dto';
import { InventoryItemGraphQLMapper } from '@contexts/inventory/transport/graphql/mappers/inventory-item.mapper';

@Resolver()
export class InventoryItemQueriesResolver {
  private readonly logger = new Logger(InventoryItemQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly inventoryItemGraphQLMapper: InventoryItemGraphQLMapper,
  ) {}

  @Query(() => PaginatedInventoryItemsResultDto)
  async inventoryItemsFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(inventoryItemFilterableFields),
    )
    input?: InventoryItemCriteriaGraphQLDto,
  ): Promise<PaginatedInventoryItemsResultDto> {
    this.logger.log(
      `Finding inventory items by criteria: ${JSON.stringify(input)}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new InventoryItemFindByCriteriaQuery(criteria),
    );

    return this.inventoryItemGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => InventoryItemResponseDto, { nullable: true })
  async inventoryItemFindById(
    @Args('input') input: InventoryItemFindByIdGraphQLDto,
  ): Promise<InventoryItemResponseDto | null> {
    this.logger.log(`Finding inventory item by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new InventoryItemFindByIdQuery({ id: input.id }),
    );

    return result
      ? this.inventoryItemGraphQLMapper.toResponseDto(result)
      : null;
  }
}
