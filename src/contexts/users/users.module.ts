import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegisterUserCommandHandler } from './application/commands/register-user/register-user.handler';
import { UserRegisteredProjection } from './application/events/user-registered/user-registered.projection';
import { FindUserByEmailQueryHandler } from './application/queries/find-user-by-email/find-user-by-email.handler';
import { GetCurrentUserQueryHandler } from './application/queries/get-current-user/get-current-user.handler';
import { USER_READ_REPOSITORY } from './domain/repositories/i-user-read.repository';
import { USER_WRITE_REPOSITORY } from './domain/repositories/i-user-write.repository';
import { UserMongoReadRepository } from './infrastructure/persistence/mongoose/user-mongo-read.repository';
import {
  UserDocument,
  UsersModel,
} from './infrastructure/persistence/mongoose/user.schema';
import { UserEntity } from './infrastructure/persistence/typeorm/user.entity';
import { UserTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/user-typeorm-write.repository';
import { UsersController } from './transport/rest/users.controller';
import { UsersResolver } from './transport/graphql/users.resolver';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    TypeOrmModule.forFeature([UserEntity]),
    MongooseModule.forFeature([{ name: UserDocument.name, schema: UsersModel }]),
  ],
  controllers: [UsersController],
  providers: [
    RegisterUserCommandHandler,
    GetCurrentUserQueryHandler,
    FindUserByEmailQueryHandler,
    UserRegisteredProjection,
    UsersResolver,
    { provide: USER_WRITE_REPOSITORY, useClass: UserTypeOrmWriteRepository },
    { provide: USER_READ_REPOSITORY, useClass: UserMongoReadRepository },
  ],
  exports: [],
})
export class UsersModule {}
