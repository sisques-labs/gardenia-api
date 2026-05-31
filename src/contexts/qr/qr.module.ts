import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateQrCommandHandler } from './application/commands/create-qr/create-qr.handler';
import { DeleteQrCommandHandler } from './application/commands/delete-qr/delete-qr.handler';
import { RegenerateQrCommandHandler } from './application/commands/regenerate-qr/regenerate-qr.handler';
import { QrFindByIdQueryHandler } from './application/queries/qr-find-by-id/qr-find-by-id.handler';
import { QrFindPngByIdQueryHandler } from './application/queries/qr-find-png-by-id/qr-find-png-by-id.handler';
import { AssertQrViewModelExistsService } from './application/services/read/assert-qr-view-model-exists/assert-qr-view-model-exists.service';
import { AssertQrExistsService } from './application/services/write/assert-qr-exists/assert-qr-exists.service';
import { QrBuilder } from './domain/builders/qr.builder';
import { QR_PNG_GENERATOR } from './domain/ports/qr-png-generator.port';
import { QR_READ_REPOSITORY } from './domain/repositories/read/qr-read.repository';
import { QR_WRITE_REPOSITORY } from './domain/repositories/write/qr-write.repository';
import { QrTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/qr.entity';
import { QrTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/qr-typeorm.mapper';
import { QrTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/qr-typeorm-read.repository';
import { QrTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/qr-typeorm-write.repository';
import { QrPngGeneratorService } from './infrastructure/services/qr-png-generator.service';
import { QrsController } from './transport/rest/controllers/qrs.controller';
import { QrRestMapper } from './transport/rest/mappers/qr/qr.mapper';
import { QrGraphQLMapper } from './transport/graphql/mappers/qr/qr.mapper';
import { QrQueriesResolver } from './transport/graphql/resolvers/qr/qr-queries.resolver';
import { QrMutationsResolver } from './transport/graphql/resolvers/qr/qr-mutations.resolver';
import './transport/graphql/enums/qr/qr-registered-enums.graphql';

const COMMAND_HANDLERS = [
  CreateQrCommandHandler,
  RegenerateQrCommandHandler,
  DeleteQrCommandHandler,
];

const QUERY_HANDLERS = [QrFindByIdQueryHandler, QrFindPngByIdQueryHandler];

const APPLICATION_SERVICES = [
  AssertQrViewModelExistsService,
  AssertQrExistsService,
];

const DOMAIN_BUILDERS = [QrBuilder];

const INFRASTRUCTURE_MAPPERS = [QrTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  { provide: QR_READ_REPOSITORY, useClass: QrTypeOrmReadRepository },
  { provide: QR_WRITE_REPOSITORY, useClass: QrTypeOrmWriteRepository },
  { provide: QR_PNG_GENERATOR, useClass: QrPngGeneratorService },
];

const REST_CONTROLLERS = [QrsController];
const REST_PROVIDERS = [QrRestMapper];

const GRAPHQL_PROVIDERS = [
  QrQueriesResolver,
  QrMutationsResolver,
  QrGraphQLMapper,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([QrTypeOrmEntity])],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
  ],
  exports: [],
})
export class QrModule {}
