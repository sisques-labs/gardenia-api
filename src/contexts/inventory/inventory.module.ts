import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdjustInventoryItemQuantityCommandHandler } from '@contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.handler';
import { CreateInventoryItemCommandHandler } from '@contexts/inventory/application/commands/create-inventory-item/create-inventory-item.handler';
import { DeleteInventoryItemCommandHandler } from '@contexts/inventory/application/commands/delete-inventory-item/delete-inventory-item.handler';
import { UpdateInventoryItemCommandHandler } from '@contexts/inventory/application/commands/update-inventory-item/update-inventory-item.handler';
import { InventoryItemFindByCriteriaQueryHandler } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.handler';
import { InventoryItemFindByIdQueryHandler } from '@contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.handler';
import { AssertInventoryItemViewModelExistsService } from '@contexts/inventory/application/services/read/assert-inventory-item-view-model-exists/assert-inventory-item-view-model-exists.service';
import { AssertInventoryItemExistsService } from '@contexts/inventory/application/services/write/assert-inventory-item-exists/assert-inventory-item-exists.service';
import { InventoryItemBuilder } from '@contexts/inventory/domain/builders/inventory-item.builder';
import { INVENTORY_ITEM_READ_REPOSITORY } from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { INVENTORY_ITEM_WRITE_REPOSITORY } from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { InventoryItemTypeOrmEntity } from '@contexts/inventory/infrastructure/persistence/typeorm/entities/inventory-item.entity';
import { InventoryItemTypeOrmMapper } from '@contexts/inventory/infrastructure/persistence/typeorm/mappers/inventory-item-typeorm.mapper';
import { InventoryItemTypeOrmReadRepository } from '@contexts/inventory/infrastructure/persistence/typeorm/repositories/inventory-item-typeorm-read.repository';
import { InventoryItemTypeOrmWriteRepository } from '@contexts/inventory/infrastructure/persistence/typeorm/repositories/inventory-item-typeorm-write.repository';
import '@contexts/inventory/transport/graphql/enums/inventory-registered-enums.graphql';
import { InventoryItemGraphQLMapper } from '@contexts/inventory/transport/graphql/mappers/inventory-item.mapper';
import { InventoryItemMutationsResolver } from '@contexts/inventory/transport/graphql/resolvers/inventory-item-mutations.resolver';
import { InventoryItemQueriesResolver } from '@contexts/inventory/transport/graphql/resolvers/inventory-item-queries.resolver';
import { InventoryItemsController } from '@contexts/inventory/transport/rest/controllers/inventory-items.controller';
import { InventoryItemRestMapper } from '@contexts/inventory/transport/rest/mappers/inventory-item/inventory-item.mapper';

const COMMAND_HANDLERS = [
  CreateInventoryItemCommandHandler,
  UpdateInventoryItemCommandHandler,
  AdjustInventoryItemQuantityCommandHandler,
  DeleteInventoryItemCommandHandler,
];

const QUERY_HANDLERS = [
  InventoryItemFindByIdQueryHandler,
  InventoryItemFindByCriteriaQueryHandler,
];

const DOMAIN_BUILDERS = [InventoryItemBuilder];

const APPLICATION_SERVICES = [
  AssertInventoryItemExistsService,
  AssertInventoryItemViewModelExistsService,
];

const INFRASTRUCTURE_MAPPERS = [InventoryItemTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: INVENTORY_ITEM_WRITE_REPOSITORY,
    useClass: InventoryItemTypeOrmWriteRepository,
  },
  {
    provide: INVENTORY_ITEM_READ_REPOSITORY,
    useClass: InventoryItemTypeOrmReadRepository,
  },
];

const INFRASTRUCTURE_ENTITIES = [InventoryItemTypeOrmEntity];

const REST_CONTROLLERS = [InventoryItemsController];
const REST_PROVIDERS = [InventoryItemRestMapper];

const GRAPHQL_PROVIDERS = [
  InventoryItemQueriesResolver,
  InventoryItemMutationsResolver,
  InventoryItemGraphQLMapper,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...DOMAIN_BUILDERS,
    ...APPLICATION_SERVICES,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
  ],
  exports: [],
})
export class InventoryModule {}
