import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegisterPushSubscriptionCommandHandler } from '@contexts/notifications/application/commands/register-push-subscription/register-push-subscription.handler';
import { SendPushNotificationCommandHandler } from '@contexts/notifications/application/commands/send-push-notification/send-push-notification.handler';
import { UnregisterPushSubscriptionCommandHandler } from '@contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.handler';
import { PUSH_SENDER_PORT } from '@contexts/notifications/application/ports/push-sender.port';
import { AssertPushSubscriptionExistsService } from '@contexts/notifications/application/services/write/assert-push-subscription-exists/assert-push-subscription-exists.service';
import { CreatePushSubscriptionService } from '@contexts/notifications/application/services/write/create-push-subscription/create-push-subscription.service';
import { DeliverPushToSubscriptionService } from '@contexts/notifications/application/services/write/deliver-push-to-subscription/deliver-push-to-subscription.service';
import { FindPushSubscriptionsForUserService } from '@contexts/notifications/application/services/write/find-push-subscriptions-for-user/find-push-subscriptions-for-user.service';
import { ReassignPushSubscriptionService } from '@contexts/notifications/application/services/write/reassign-push-subscription/reassign-push-subscription.service';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { PUSH_SUBSCRIPTION_READ_REPOSITORY } from '@contexts/notifications/domain/repositories/read/push-subscription-read.repository';
import { PUSH_SUBSCRIPTION_WRITE_REPOSITORY } from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';
import { WebPushAdapter } from '@contexts/notifications/infrastructure/adapters/web-push.adapter';
import { PushSubscriptionTypeOrmEntity } from '@contexts/notifications/infrastructure/persistence/typeorm/entities/push-subscription.entity';
import { PushSubscriptionTypeOrmMapper } from '@contexts/notifications/infrastructure/persistence/typeorm/mappers/push-subscription-typeorm.mapper';
import { PushSubscriptionTypeOrmReadRepository } from '@contexts/notifications/infrastructure/persistence/typeorm/repositories/push-subscription-typeorm-read.repository';
import { PushSubscriptionTypeOrmWriteRepository } from '@contexts/notifications/infrastructure/persistence/typeorm/repositories/push-subscription-typeorm-write.repository';
import { PushSubscriptionMutationsResolver } from '@contexts/notifications/transport/graphql/resolvers/push-subscription-mutations.resolver';
import { PushSubscriptionRegisterMcpTool } from '@contexts/notifications/transport/mcp/tools/push-subscription-register.tool';
import { PushSubscriptionUnregisterMcpTool } from '@contexts/notifications/transport/mcp/tools/push-subscription-unregister.tool';
import {
  PUSH_NOTIFICATIONS_QUEUE,
  PushNotificationsProcessor,
} from '@contexts/notifications/transport/queues/push-notifications.processor';
import { PushSubscriptionsController } from '@contexts/notifications/transport/rest/controllers/push-subscriptions.controller';

const COMMAND_HANDLERS = [
  RegisterPushSubscriptionCommandHandler,
  UnregisterPushSubscriptionCommandHandler,
  SendPushNotificationCommandHandler,
];

const DOMAIN_BUILDERS = [PushSubscriptionBuilder];

const APPLICATION_SERVICES = [
  AssertPushSubscriptionExistsService,
  ReassignPushSubscriptionService,
  CreatePushSubscriptionService,
  FindPushSubscriptionsForUserService,
  DeliverPushToSubscriptionService,
];

const INFRASTRUCTURE_MAPPERS = [PushSubscriptionTypeOrmMapper];

const INFRASTRUCTURE_ADAPTERS = [
  { provide: PUSH_SENDER_PORT, useClass: WebPushAdapter },
];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: PUSH_SUBSCRIPTION_WRITE_REPOSITORY,
    useClass: PushSubscriptionTypeOrmWriteRepository,
  },
  {
    provide: PUSH_SUBSCRIPTION_READ_REPOSITORY,
    useClass: PushSubscriptionTypeOrmReadRepository,
  },
];

const INFRASTRUCTURE_ENTITIES = [PushSubscriptionTypeOrmEntity];

const REST_CONTROLLERS = [PushSubscriptionsController];

const GRAPHQL_PROVIDERS = [PushSubscriptionMutationsResolver];

const MCP_TOOLS = [
  PushSubscriptionRegisterMcpTool,
  PushSubscriptionUnregisterMcpTool,
];

const QUEUE_PROVIDERS = [PushNotificationsProcessor];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES),
    BullModule.registerQueue({
      name: PUSH_NOTIFICATIONS_QUEUE,
      defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
    }),
  ],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...DOMAIN_BUILDERS,
    ...APPLICATION_SERVICES,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_ADAPTERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...GRAPHQL_PROVIDERS,
    ...MCP_TOOLS,
    ...QUEUE_PROVIDERS,
  ],
  exports: [],
})
export class NotificationsModule {}
