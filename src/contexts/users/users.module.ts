import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@contexts/auth/auth.module';

import { CreateUserCommandHandler } from './application/commands/create-user/create-user.handler';
import { DeleteUserCommandHandler } from './application/commands/delete-user/delete-user.handler';
import { UpdateUserCommandHandler } from './application/commands/update-user/update-user.handler';
import { UserFindByCriteriaQueryHandler } from './application/queries/user-find-by-criteria/user-find-by-criteria.handler';
import { UserFindByIdQueryHandler } from './application/queries/user-find-by-id/user-find-by-id.handler';
import { AssertUserViewModelExistsService } from './application/services/read/assert-user-view-model-exists/assert-user-view-model-exists.service';
import { AssertUserExistsService } from './application/services/write/assert-user-exists/assert-user-exists.service';
import { USER_READ_REPOSITORY } from './domain/repositories/read/user-read.repository';
import { USER_WRITE_REPOSITORY } from './domain/repositories/write/user-write.repository';
import { UserBuilder } from './domain/builders/user.builder';
import { UserTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/user.entity';
import { UserTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { UserTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/user-typeorm-write.repository';
import './transport/graphql/enums/user/user-registered-enums.graphql';
import { UserGraphQLMapper } from './transport/graphql/mappers/user/user.mapper';
import { UserMutationsResolver } from './transport/graphql/resolvers/user/user-mutations.resolver';
import { UserQueriesResolver } from './transport/graphql/resolvers/user/user-queries.resolver';
import { MutationResponseGraphQLMapper } from '@sisques-labs/nestjs-kit';

@Module({
  imports: [CqrsModule, AuthModule, TypeOrmModule.forFeature([UserTypeOrmEntity])],
  providers: [
    CreateUserCommandHandler,
    UpdateUserCommandHandler,
    DeleteUserCommandHandler,
    UserFindByIdQueryHandler,
    UserFindByCriteriaQueryHandler,
    AssertUserViewModelExistsService,
    AssertUserExistsService,
    UserBuilder,
    UserTypeOrmMapper,
    UserGraphQLMapper,
    MutationResponseGraphQLMapper,
    UserQueriesResolver,
    UserMutationsResolver,
    { provide: USER_WRITE_REPOSITORY, useClass: UserTypeOrmWriteRepository },
  ],
  exports: [USER_WRITE_REPOSITORY],
})
export class UsersModule {}
