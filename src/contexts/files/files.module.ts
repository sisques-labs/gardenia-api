import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client } from '@aws-sdk/client-s3';

import { DeleteFileCommandHandler } from '@contexts/files/application/commands/delete-file/delete-file.handler';
import { UploadFileCommandHandler } from '@contexts/files/application/commands/upload-file/upload-file.handler';
import { FileFindByCriteriaQueryHandler } from '@contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.handler';
import { FileFindByIdQueryHandler } from '@contexts/files/application/queries/file-find-by-id/file-find-by-id.handler';
import { FileFindContentByIdQueryHandler } from '@contexts/files/application/queries/file-find-content-by-id/file-find-content-by-id.handler';
import { AssertFileViewModelExistsService } from '@contexts/files/application/services/read/assert-file-view-model-exists/assert-file-view-model-exists.service';
import { AssertFileExistsService } from '@contexts/files/application/services/write/assert-file-exists/assert-file-exists.service';
import { FILE_STORAGE_PORT } from '@contexts/files/application/ports/file-storage.port';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import { FILE_READ_REPOSITORY } from '@contexts/files/domain/repositories/read/file-read.repository';
import { FILE_WRITE_REPOSITORY } from '@contexts/files/domain/repositories/write/file-write.repository';
import { DatabaseFileStorageAdapter } from '@contexts/files/infrastructure/adapters/database-file-storage.adapter';
import { S3FileStorageAdapter } from '@contexts/files/infrastructure/adapters/s3-file-storage.adapter';
import {
  FilesConfig,
  filesConfig,
} from '@contexts/files/infrastructure/config/files.config';
import {
  S3_CLIENT,
  s3ClientProvider,
} from '@contexts/files/infrastructure/config/s3-client.provider';
import { FileContentTypeOrmEntity } from '@contexts/files/infrastructure/persistence/typeorm/entities/file-content.entity';
import { FileTypeOrmEntity } from '@contexts/files/infrastructure/persistence/typeorm/entities/file.entity';
import { FileTypeOrmMapper } from '@contexts/files/infrastructure/persistence/typeorm/mappers/file-typeorm.mapper';
import { FileTypeOrmReadRepository } from '@contexts/files/infrastructure/persistence/typeorm/repositories/file-typeorm-read.repository';
import { FileTypeOrmWriteRepository } from '@contexts/files/infrastructure/persistence/typeorm/repositories/file-typeorm-write.repository';
import '@contexts/files/transport/graphql/enums/file-registered-enums.graphql';
import { FileGraphQLMapper } from '@contexts/files/transport/graphql/mappers/file/file.mapper';
import { FileMutationsResolver } from '@contexts/files/transport/graphql/resolvers/file/mutations/file-mutations.resolver';
import { FileQueriesResolver } from '@contexts/files/transport/graphql/resolvers/file/queries/file-queries.resolver';
import { FileDeleteMcpTool } from '@contexts/files/transport/mcp/tools/file-delete.tool';
import { FileFindByIdMcpTool } from '@contexts/files/transport/mcp/tools/file-find-by-id.tool';
import { FileListMcpTool } from '@contexts/files/transport/mcp/tools/file-list.tool';
import { FilesController } from '@contexts/files/transport/rest/controllers/files.controller';
import { FileRestMapper } from '@contexts/files/transport/rest/mappers/file/file.mapper';
import { ImageFileValidationPipe } from '@contexts/files/transport/rest/pipes/image-file-validation.pipe';
import { SpaceContext } from '@shared/space-context/space-context.service';

const COMMAND_HANDLERS = [UploadFileCommandHandler, DeleteFileCommandHandler];

const QUERY_HANDLERS = [
  FileFindByIdQueryHandler,
  FileFindContentByIdQueryHandler,
  FileFindByCriteriaQueryHandler,
];

const DOMAIN_BUILDERS = [FileBuilder];

const APPLICATION_SERVICES = [
  AssertFileExistsService,
  AssertFileViewModelExistsService,
];

const INFRASTRUCTURE_MAPPERS = [FileTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: FILE_WRITE_REPOSITORY,
    useClass: FileTypeOrmWriteRepository,
  },
  {
    provide: FILE_READ_REPOSITORY,
    useClass: FileTypeOrmReadRepository,
  },
  {
    provide: FILE_STORAGE_PORT,
    inject: [
      filesConfig.KEY,
      getRepositoryToken(FileContentTypeOrmEntity),
      SpaceContext,
      S3_CLIENT,
    ],
    useFactory: (
      config: FilesConfig,
      contentRepo: Repository<FileContentTypeOrmEntity>,
      spaceContext: SpaceContext,
      s3Client: S3Client,
    ) =>
      config.storageDriver === 's3'
        ? new S3FileStorageAdapter(s3Client, spaceContext, config)
        : new DatabaseFileStorageAdapter(contentRepo, spaceContext, config),
  },
];

const INFRASTRUCTURE_STORAGE_PROVIDERS = [
  s3ClientProvider,
  DatabaseFileStorageAdapter,
  S3FileStorageAdapter,
];

const INFRASTRUCTURE_ENTITIES = [FileTypeOrmEntity, FileContentTypeOrmEntity];

const REST_CONTROLLERS = [FilesController];
const REST_PROVIDERS = [FileRestMapper, ImageFileValidationPipe];

const GRAPHQL_PROVIDERS = [
  FileQueriesResolver,
  FileMutationsResolver,
  FileGraphQLMapper,
];

const MCP_TOOLS = [FileFindByIdMcpTool, FileListMcpTool, FileDeleteMcpTool];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES),
    ConfigModule.forFeature(filesConfig),
  ],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...DOMAIN_BUILDERS,
    ...APPLICATION_SERVICES,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...INFRASTRUCTURE_STORAGE_PROVIDERS,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
    ...MCP_TOOLS,
  ],
  exports: [],
})
export class FilesModule {}
