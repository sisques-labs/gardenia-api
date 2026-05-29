import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceContext } from '../../shared/space-context/space-context.service';

import { USER_READ_REPOSITORY } from '@contexts/users/domain/repositories/read/user-read.repository';
import { CreateUserCommandHandler } from './application/commands/create-user/create-user.handler';
import { DeleteUserCommandHandler } from './application/commands/delete-user/delete-user.handler';
import { UpdateUserCommandHandler } from './application/commands/update-user/update-user.handler';
import { UserFindByCriteriaQueryHandler } from './application/queries/user-find-by-criteria/user-find-by-criteria.handler';
import { UserFindByIdQueryHandler } from './application/queries/user-find-by-id/user-find-by-id.handler';
import { AssertUsernameAvailableService } from './application/services/read/assert-username-available/assert-username-available.service';
import { AssertUserViewModelExistsService } from './application/services/read/assert-user-view-model-exists/assert-user-view-model-exists.service';
import { AssertUserExistsService } from './application/services/write/assert-user-exists/assert-user-exists.service';
import { UserBuilder } from './domain/builders/user.builder';
import { USER_WRITE_REPOSITORY } from './domain/repositories/write/user-write.repository';
import { UserTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/user.entity';
import { UserTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { UserTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/user-typeorm-read.repository';
import { UserTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/user-typeorm-write.repository';
import './transport/graphql/enums/user/user-registered-enums.graphql';
import { UserGraphQLMapper } from './transport/graphql/mappers/user/user.mapper';
import { UserMutationsResolver } from './transport/graphql/resolvers/user/user-mutations.resolver';
import { UserQueriesResolver } from './transport/graphql/resolvers/user/user-queries.resolver';

const COMMAND_HANDLERS = [
  CreateUserCommandHandler,
  UpdateUserCommandHandler,
  DeleteUserCommandHandler,
];

const QUERY_HANDLERS = [
  UserFindByIdQueryHandler,
  UserFindByCriteriaQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertUserViewModelExistsService,
  AssertUserExistsService,
  AssertUsernameAvailableService,
];

const DOMAIN_BUILDERS = [UserBuilder];

const INFRASTRUCTURE_REPOSITORIES = [
  { provide: USER_WRITE_REPOSITORY, useClass: UserTypeOrmWriteRepository },
  { provide: USER_READ_REPOSITORY, useClass: UserTypeOrmReadRepository },
];

const INFRASTRUCTURE_MAPPERS = [UserTypeOrmMapper];

const TRANSPORT_GRAPHQL_MAPPERS = [UserGraphQLMapper];

const TRANSPORT_GRAPHQL_RESOLVERS = [
  UserQueriesResolver,
  UserMutationsResolver,
];

const INFRASTRUCTURE_ENTITIES = [UserTypeOrmEntity];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)],
  providers: [
    SpaceContext,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...TRANSPORT_GRAPHQL_MAPPERS,
    ...TRANSPORT_GRAPHQL_RESOLVERS,
    ...INFRASTRUCTURE_REPOSITORIES,
  ],
  exports: [],
})
export class UsersModule {}
