import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BootstrapBridgeCommandHandler } from './application/commands/bootstrap-bridge/bootstrap-bridge.handler';
import { ClaimBridgeCommandHandler } from './application/commands/claim-bridge/claim-bridge.handler';
import { RecordNodeCommandAckCommandHandler } from './application/commands/record-node-command-ack/record-node-command-ack.handler';
import { RecordNodeHeartbeatCommandHandler } from './application/commands/record-node-heartbeat/record-node-heartbeat.handler';
import { RecordTelemetryReadingCommandHandler } from './application/commands/record-telemetry-reading/record-telemetry-reading.handler';
import { SendNodeCommandCommandHandler } from './application/commands/send-node-command/send-node-command.handler';
import { NODE_COMMAND_PRODUCER_PORT } from './application/ports/node-command-producer.port';
import { BridgeFindByCriteriaQueryHandler } from './application/queries/bridge-find-by-criteria/bridge-find-by-criteria.handler';
import { BridgeFindByIdQueryHandler } from './application/queries/bridge-find-by-id/bridge-find-by-id.handler';
import { NodeFindByCriteriaQueryHandler } from './application/queries/node-find-by-criteria/node-find-by-criteria.handler';
import { NodeFindByIdQueryHandler } from './application/queries/node-find-by-id/node-find-by-id.handler';
import { NodeTelemetryReadingFindByCriteriaQueryHandler } from './application/queries/node-telemetry-reading-find-by-criteria/node-telemetry-reading-find-by-criteria.handler';
import { AssertBridgeViewModelExistsService } from './application/services/read/assert-bridge-view-model-exists/assert-bridge-view-model-exists.service';
import { AssertNodeViewModelExistsService } from './application/services/read/assert-node-view-model-exists/assert-node-view-model-exists.service';
import { AssertBridgeExistsService } from './application/services/write/assert-bridge-exists/assert-bridge-exists.service';
import { AssertNodeExistsService } from './application/services/write/assert-node-exists/assert-node-exists.service';
import { FindOrCreateNodeService } from './application/services/write/find-or-create-node/find-or-create-node.service';
import { BridgeBuilder } from './domain/builders/bridge.builder';
import { NodeBuilder } from './domain/builders/node.builder';
import { BRIDGE_READ_REPOSITORY } from './domain/repositories/read/bridge-read.repository';
import { NODE_READ_REPOSITORY } from './domain/repositories/read/node-read.repository';
import { NODE_TELEMETRY_READING_READ_REPOSITORY } from './domain/repositories/read/node-telemetry-reading-read.repository';
import { BRIDGE_WRITE_REPOSITORY } from './domain/repositories/write/bridge-write.repository';
import { NODE_COMMAND_ACK_WRITE_REPOSITORY } from './domain/repositories/write/node-command-ack-write.repository';
import { NODE_TELEMETRY_READING_WRITE_REPOSITORY } from './domain/repositories/write/node-telemetry-reading-write.repository';
import { NODE_WRITE_REPOSITORY } from './domain/repositories/write/node-write.repository';
import { BridgeTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/bridge.entity';
import { NodeCommandAckTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/node-command-ack.entity';
import { NodeTelemetryReadingTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/node-telemetry-reading.entity';
import { NodeTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/node.entity';
import { BridgeTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/bridge-typeorm.mapper';
import { NodeCommandAckTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/node-command-ack-typeorm.mapper';
import { NodeTelemetryReadingTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/node-telemetry-reading-typeorm.mapper';
import { NodeTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/node-typeorm.mapper';
import { BridgeTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/bridge-typeorm-read.repository';
import { BridgeTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/bridge-typeorm-write.repository';
import { NodeCommandAckTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/node-command-ack-typeorm-write.repository';
import { NodeTelemetryReadingTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/node-telemetry-reading-typeorm-read.repository';
import { NodeTelemetryReadingTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/node-telemetry-reading-typeorm-write.repository';
import { NodeTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/node-typeorm-read.repository';
import { NodeTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/node-typeorm-write.repository';
import { NodesKafkaCommandProducerAdapter } from './infrastructure/messaging/kafka/nodes-kafka-command-producer.adapter';
import { NodesKafkaConsumerBootstrapService } from './infrastructure/messaging/kafka/nodes-kafka-consumer-bootstrap.service';
import './transport/graphql/enums/nodes-registered-enums.graphql';
import { BridgeGraphQLMapper } from './transport/graphql/mappers/bridge.mapper';
import { NodeTelemetryReadingGraphQLMapper } from './transport/graphql/mappers/node-telemetry-reading.mapper';
import { NodeGraphQLMapper } from './transport/graphql/mappers/node.mapper';
import { BridgeMutationsResolver } from './transport/graphql/resolvers/bridge-mutations.resolver';
import { BridgeQueriesResolver } from './transport/graphql/resolvers/bridge-queries.resolver';
import { NodeMutationsResolver } from './transport/graphql/resolvers/node-mutations.resolver';
import { NodeQueriesResolver } from './transport/graphql/resolvers/node-queries.resolver';
import { BridgeClaimMcpTool } from './transport/mcp/tools/bridge-claim.tool';
import { BridgeFindByCriteriaMcpTool } from './transport/mcp/tools/bridge-find-by-criteria.tool';
import { BridgeFindByIdMcpTool } from './transport/mcp/tools/bridge-find-by-id.tool';
import { NodeFindByCriteriaMcpTool } from './transport/mcp/tools/node-find-by-criteria.tool';
import { NodeFindByIdMcpTool } from './transport/mcp/tools/node-find-by-id.tool';
import { NodeSendCommandMcpTool } from './transport/mcp/tools/node-send-command.tool';
import { NodeTelemetryReadingFindByCriteriaMcpTool } from './transport/mcp/tools/node-telemetry-reading-find-by-criteria.tool';
import { BridgesController } from './transport/rest/controllers/bridges.controller';

const COMMAND_HANDLERS = [
  BootstrapBridgeCommandHandler,
  ClaimBridgeCommandHandler,
  SendNodeCommandCommandHandler,
  RecordTelemetryReadingCommandHandler,
  RecordNodeHeartbeatCommandHandler,
  RecordNodeCommandAckCommandHandler,
];

const QUERY_HANDLERS = [
  NodeFindByIdQueryHandler,
  NodeFindByCriteriaQueryHandler,
  BridgeFindByIdQueryHandler,
  BridgeFindByCriteriaQueryHandler,
  NodeTelemetryReadingFindByCriteriaQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertBridgeViewModelExistsService,
  AssertBridgeExistsService,
  AssertNodeViewModelExistsService,
  AssertNodeExistsService,
  FindOrCreateNodeService,
];

const DOMAIN_BUILDERS = [BridgeBuilder, NodeBuilder];

const INFRASTRUCTURE_MAPPERS = [
  BridgeTypeOrmMapper,
  NodeTypeOrmMapper,
  NodeTelemetryReadingTypeOrmMapper,
  NodeCommandAckTypeOrmMapper,
];

const INFRASTRUCTURE_ENTITIES = [
  BridgeTypeOrmEntity,
  NodeTypeOrmEntity,
  NodeTelemetryReadingTypeOrmEntity,
  NodeCommandAckTypeOrmEntity,
];

const INFRASTRUCTURE_REPOSITORIES = [
  { provide: BRIDGE_READ_REPOSITORY, useClass: BridgeTypeOrmReadRepository },
  { provide: BRIDGE_WRITE_REPOSITORY, useClass: BridgeTypeOrmWriteRepository },
  { provide: NODE_READ_REPOSITORY, useClass: NodeTypeOrmReadRepository },
  { provide: NODE_WRITE_REPOSITORY, useClass: NodeTypeOrmWriteRepository },
  {
    provide: NODE_TELEMETRY_READING_READ_REPOSITORY,
    useClass: NodeTelemetryReadingTypeOrmReadRepository,
  },
  {
    provide: NODE_TELEMETRY_READING_WRITE_REPOSITORY,
    useClass: NodeTelemetryReadingTypeOrmWriteRepository,
  },
  {
    provide: NODE_COMMAND_ACK_WRITE_REPOSITORY,
    useClass: NodeCommandAckTypeOrmWriteRepository,
  },
];

const MESSAGING_PROVIDERS = [
  NodesKafkaConsumerBootstrapService,
  {
    provide: NODE_COMMAND_PRODUCER_PORT,
    useClass: NodesKafkaCommandProducerAdapter,
  },
];

const REST_CONTROLLERS = [BridgesController];

const GRAPHQL_PROVIDERS = [
  BridgeQueriesResolver,
  BridgeMutationsResolver,
  NodeQueriesResolver,
  NodeMutationsResolver,
  BridgeGraphQLMapper,
  NodeGraphQLMapper,
  NodeTelemetryReadingGraphQLMapper,
];

const MCP_TOOLS = [
  BridgeClaimMcpTool,
  BridgeFindByIdMcpTool,
  BridgeFindByCriteriaMcpTool,
  NodeFindByIdMcpTool,
  NodeFindByCriteriaMcpTool,
  NodeSendCommandMcpTool,
  NodeTelemetryReadingFindByCriteriaMcpTool,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...MESSAGING_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
    ...MCP_TOOLS,
  ],
  exports: [],
})
export class NodesModule {}
