import { CreateQrCommandHandler } from '@contexts/qr/application/commands/create-qr/create-qr.handler';
import { DeleteQrCommandHandler } from '@contexts/qr/application/commands/delete-qr/delete-qr.handler';
import { RegenerateQrCommandHandler } from '@contexts/qr/application/commands/regenerate-qr/regenerate-qr.handler';
import { QrFindByIdQueryHandler } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.handler';
import { QrFindPngByIdQueryHandler } from '@contexts/qr/application/queries/qr-find-png-by-id/qr-find-png-by-id.handler';
import { AssertQrViewModelExistsService } from '@contexts/qr/application/services/read/assert-qr-view-model-exists/assert-qr-view-model-exists.service';
import { AssertQrExistsService } from '@contexts/qr/application/services/write/assert-qr-exists/assert-qr-exists.service';
import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import { QR_PNG_GENERATOR } from '@contexts/qr/domain/ports/qr-png-generator.port';
import { QR_READ_REPOSITORY } from '@contexts/qr/domain/repositories/read/qr-read.repository';
import { QR_WRITE_REPOSITORY } from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { AssertQrExpiresAtIsFutureDomainService } from '@contexts/qr/domain/services/assert-qr-expires-at-is-future/assert-qr-expires-at-is-future.domain-service';
import { AssertQrNotExpiredDomainService } from '@contexts/qr/domain/services/assert-qr-not-expired/assert-qr-not-expired.domain-service';
import { QrTypeOrmEntity } from '@contexts/qr/infrastructure/persistence/typeorm/entities/qr.entity';
import { QrTypeOrmMapper } from '@contexts/qr/infrastructure/persistence/typeorm/mappers/qr-typeorm.mapper';
import { QrTypeOrmReadRepository } from '@contexts/qr/infrastructure/persistence/typeorm/repositories/qr-typeorm-read.repository';
import { QrTypeOrmWriteRepository } from '@contexts/qr/infrastructure/persistence/typeorm/repositories/qr-typeorm-write.repository';
import { QrPngGeneratorService } from '@contexts/qr/infrastructure/services/qr-png-generator.service';
import '@contexts/qr/transport/graphql/enums/qr/qr-registered-enums.graphql';
import { QrGraphQLMapper } from '@contexts/qr/transport/graphql/mappers/qr/qr.mapper';
import { QrMutationsResolver } from '@contexts/qr/transport/graphql/resolvers/qr/qr-mutations.resolver';
import { QrQueriesResolver } from '@contexts/qr/transport/graphql/resolvers/qr/qr-queries.resolver';
import { QrsController } from '@contexts/qr/transport/rest/controllers/qrs.controller';
import { QrRestMapper } from '@contexts/qr/transport/rest/mappers/qr/qr.mapper';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

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

const DOMAIN_SERVICES = [
  AssertQrExpiresAtIsFutureDomainService,
  AssertQrNotExpiredDomainService,
];

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
    ...DOMAIN_SERVICES,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
  ],
  exports: [],
})
export class QrModule {}
