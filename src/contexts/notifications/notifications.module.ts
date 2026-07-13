import '@contexts/notifications/transport/graphql/enums/notifications-registered-enums.graphql';

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MarkAllNotificationsReadCommandHandler } from '@contexts/notifications/application/commands/mark-all-notifications-read/mark-all-notifications-read.handler';
import { MarkNotificationReadCommandHandler } from '@contexts/notifications/application/commands/mark-notification-read/mark-notification-read.handler';
import { ReconcileSpaceNotificationsCommandHandler } from '@contexts/notifications/application/commands/reconcile-space-notifications/reconcile-space-notifications.handler';
import { CARE_SCHEDULE_ALERTS_PORT } from '@contexts/notifications/application/ports/care-schedule-alerts.port';
import { INVENTORY_ALERTS_PORT } from '@contexts/notifications/application/ports/inventory-alerts.port';
import { NOTIFICATION_DISPATCHER_PORT } from '@contexts/notifications/application/ports/notification-dispatcher.port';
import { SPACE_DIRECTORY_PORT } from '@contexts/notifications/application/ports/space-directory.port';
import { USER_DIRECTORY_PORT } from '@contexts/notifications/application/ports/user-directory.port';
import { NotificationFindByCriteriaQueryHandler } from '@contexts/notifications/application/queries/notification-find-by-criteria/notification-find-by-criteria.handler';
import { NotificationsUnreadCountQueryHandler } from '@contexts/notifications/application/queries/notifications-unread-count/notifications-unread-count.handler';
import { NotificationReconciliationService } from '@contexts/notifications/application/services/notification-reconciliation/notification-reconciliation.service';
import { AssertNotificationExistsService } from '@contexts/notifications/application/services/write/assert-notification-exists/assert-notification-exists.service';
import { NotificationBuilder } from '@contexts/notifications/domain/builders/notification.builder';
import { NOTIFICATION_READ_REPOSITORY } from '@contexts/notifications/domain/repositories/read/notification-read.repository';
import { NOTIFICATION_WRITE_REPOSITORY } from '@contexts/notifications/domain/repositories/write/notification-write.repository';
import { CareScheduleAlertsAdapter } from '@contexts/notifications/infrastructure/adapters/care-schedule-alerts.adapter';
import { InventoryAlertsAdapter } from '@contexts/notifications/infrastructure/adapters/inventory-alerts.adapter';
import { NoopNotificationDispatcherAdapter } from '@contexts/notifications/infrastructure/adapters/noop-notification-dispatcher.adapter';
import { SpaceDirectoryAdapter } from '@contexts/notifications/infrastructure/adapters/space-directory.adapter';
import { UserDirectoryAdapter } from '@contexts/notifications/infrastructure/adapters/user-directory.adapter';
import { NotificationTypeOrmEntity } from '@contexts/notifications/infrastructure/persistence/typeorm/entities/notification.entity';
import { NotificationTypeOrmMapper } from '@contexts/notifications/infrastructure/persistence/typeorm/mappers/notification-typeorm.mapper';
import { NotificationTypeOrmReadRepository } from '@contexts/notifications/infrastructure/persistence/typeorm/repositories/notification-typeorm-read.repository';
import { NotificationTypeOrmWriteRepository } from '@contexts/notifications/infrastructure/persistence/typeorm/repositories/notification-typeorm-write.repository';
import { NotificationSseConnectionRegistry } from '@contexts/notifications/infrastructure/realtime/notification-sse-connection.registry';
import { NotificationSseForwarderService } from '@contexts/notifications/infrastructure/realtime/notification-sse-forwarder.service';
import { NotificationsReconciliationJob } from '@contexts/notifications/transport/jobs/notifications-reconciliation.job';
import { NotificationGraphQLMapper } from '@contexts/notifications/transport/graphql/mappers/notification.mapper';
import { NotificationMutationsResolver } from '@contexts/notifications/transport/graphql/resolvers/notification-mutations.resolver';
import { NotificationQueriesResolver } from '@contexts/notifications/transport/graphql/resolvers/notification-queries.resolver';
import { NotificationFindByCriteriaMcpTool } from '@contexts/notifications/transport/mcp/tools/notification-find-by-criteria.tool';
import { NotificationMarkAllReadMcpTool } from '@contexts/notifications/transport/mcp/tools/notification-mark-all-read.tool';
import { NotificationMarkReadMcpTool } from '@contexts/notifications/transport/mcp/tools/notification-mark-read.tool';
import { NotificationUnreadCountMcpTool } from '@contexts/notifications/transport/mcp/tools/notification-unread-count.tool';
import { NotificationsController } from '@contexts/notifications/transport/rest/controllers/notifications.controller';
import { NotificationsStreamController } from '@contexts/notifications/transport/rest/controllers/notifications-stream.controller';
import { NotificationRestMapper } from '@contexts/notifications/transport/rest/mappers/notification/notification.mapper';

const COMMAND_HANDLERS = [
  MarkNotificationReadCommandHandler,
  MarkAllNotificationsReadCommandHandler,
  ReconcileSpaceNotificationsCommandHandler,
];

const QUERY_HANDLERS = [
  NotificationFindByCriteriaQueryHandler,
  NotificationsUnreadCountQueryHandler,
];

const DOMAIN_BUILDERS = [NotificationBuilder];

const APPLICATION_SERVICES = [
  AssertNotificationExistsService,
  NotificationReconciliationService,
];

const INFRASTRUCTURE_MAPPERS = [NotificationTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: NOTIFICATION_WRITE_REPOSITORY,
    useClass: NotificationTypeOrmWriteRepository,
  },
  {
    provide: NOTIFICATION_READ_REPOSITORY,
    useClass: NotificationTypeOrmReadRepository,
  },
];

const INFRASTRUCTURE_ADAPTERS = [
  { provide: CARE_SCHEDULE_ALERTS_PORT, useClass: CareScheduleAlertsAdapter },
  { provide: INVENTORY_ALERTS_PORT, useClass: InventoryAlertsAdapter },
  { provide: USER_DIRECTORY_PORT, useClass: UserDirectoryAdapter },
  { provide: SPACE_DIRECTORY_PORT, useClass: SpaceDirectoryAdapter },
  {
    provide: NOTIFICATION_DISPATCHER_PORT,
    useClass: NoopNotificationDispatcherAdapter,
  },
];

const INFRASTRUCTURE_ENTITIES = [NotificationTypeOrmEntity];

const REALTIME_PROVIDERS = [
  NotificationSseConnectionRegistry,
  NotificationSseForwarderService,
];

const TRANSPORT_PROVIDERS = [NotificationsReconciliationJob];

const REST_CONTROLLERS = [
  NotificationsController,
  NotificationsStreamController,
];
const REST_PROVIDERS = [NotificationRestMapper];

const GRAPHQL_PROVIDERS = [
  NotificationQueriesResolver,
  NotificationMutationsResolver,
  NotificationGraphQLMapper,
];

const MCP_TOOLS = [
  NotificationFindByCriteriaMcpTool,
  NotificationUnreadCountMcpTool,
  NotificationMarkReadMcpTool,
  NotificationMarkAllReadMcpTool,
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
    ...INFRASTRUCTURE_ADAPTERS,
    ...REALTIME_PROVIDERS,
    ...TRANSPORT_PROVIDERS,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
    ...MCP_TOOLS,
  ],
  exports: [],
})
export class NotificationsModule {}
