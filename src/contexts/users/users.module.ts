import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateUserCommandHandler } from './application/commands/create-user/create-user.handler';
import { DeleteUserCommandHandler } from './application/commands/delete-user/delete-user.handler';
import { UpdateUserCommandHandler } from './application/commands/update-user/update-user.handler';
import { UserCreatedProjection } from './application/events/user-registered/user-registered.projection';
import { GetCurrentUserQueryHandler } from './application/queries/get-current-user/get-current-user.handler';
import { USER_READ_REPOSITORY } from './domain/repositories/read/user-read.repository';
import { USER_WRITE_REPOSITORY } from './domain/repositories/write/user-write.repository';
import { UserMongoReadRepository } from './infrastructure/persistence/mongoose/user-mongo-read.repository';
import {
  UserDocument,
  UsersModel,
} from './infrastructure/persistence/mongoose/user.schema';
import { UserEntity } from './infrastructure/persistence/typeorm/entities/user.entity';
import { UserTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/user-typeorm-write.repository';
import { UsersResolver } from './transport/graphql/users.resolver';
import { UsersController } from './transport/rest/users.controller';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    TypeOrmModule.forFeature([UserEntity]),
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UsersModel },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    CreateUserCommandHandler,
    UpdateUserCommandHandler,
    DeleteUserCommandHandler,
    GetCurrentUserQueryHandler,
    UserCreatedProjection,
    UsersResolver,
    { provide: USER_WRITE_REPOSITORY, useClass: UserTypeOrmWriteRepository },
    { provide: USER_READ_REPOSITORY, useClass: UserMongoReadRepository },
  ],
  exports: [],
})
export class UsersModule {}
