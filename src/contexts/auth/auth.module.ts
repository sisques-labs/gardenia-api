import { ChangePasswordCommandHandler } from '@contexts/auth/application/commands/change-password/change-password.handler';
import { DeleteAccountCommandHandler } from '@contexts/auth/application/commands/delete-account/delete-account.handler';
import { LoginAccountCommandHandler } from '@contexts/auth/application/commands/login-account/login-account.handler';
import { ValidateAccountCredentialsService } from '@contexts/auth/application/services/read/validate-account-credentials/validate-account-credentials.service';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { AUTH_SESSION_WRITE_REPOSITORY } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import { AuthSessionTypeOrmRepository } from '@contexts/auth/infrastructure/persistence/typeorm/auth-session-typeorm.repository';
import { AuthSessionEntity } from '@contexts/auth/infrastructure/persistence/typeorm/auth-session.entity';
import { AuthSessionTypeOrmMapper } from '@contexts/auth/infrastructure/persistence/typeorm/auth-session.mapper';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisterAccountCommandHandler } from './application/commands/register-account/register-account.handler';
import { AccountFindByCriteriaQueryHandler } from './application/queries/account-find-by-criteria/account-find-by-criteria.handler';
import { AccountFindByIdQueryHandler } from './application/queries/account-find-by-id/account-find-by-id.handler';
import { AuthService } from './application/services/auth.service';
import { AssertAccountViewModelExistsService } from './application/services/read/assert-account-view-model-exists/assert-account-view-model-exists.service';
import { TokenService } from './application/services/token.service';
import { AssertAccountEmailAvailableService } from './application/services/write/assert-account-email-available/assert-account-email-available.service';
import { AssertAccountExistsService } from './application/services/write/assert-account-exists/assert-account-exists.service';
import { AccountBuilder } from './domain/builders/account.builder';
import { ACCOUNT_READ_REPOSITORY } from './domain/repositories/read/account-read.repository';
import { ACCOUNT_WRITE_REPOSITORY } from './domain/repositories/write/account-write.repository';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { LocalAuthGuard } from './infrastructure/guards/local-auth.guard';
import { AccountTypeOrmReadRepository } from './infrastructure/persistence/typeorm/account-typeorm-read.repository';
import { AccountTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/account-typeorm-write.repository';
import { AccountTypeOrmMapper } from './infrastructure/persistence/typeorm/account-typeorm.mapper';
import { AccountEntity } from './infrastructure/persistence/typeorm/account.entity';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { AuthResolver } from './transport/graphql/auth.resolver';
import { AuthController } from './transport/rest/auth.controller';

const COMMAND_HANDLERS = [
  ChangePasswordCommandHandler,
  DeleteAccountCommandHandler,
  RegisterAccountCommandHandler,
  LoginAccountCommandHandler,
];

const QUERY_HANDLERS = [
  AccountFindByIdQueryHandler,
  AccountFindByCriteriaQueryHandler,
];

const APPLICATION_SERVICES = [
  AuthService,
  TokenService,
  AssertAccountExistsService,
  AssertAccountEmailAvailableService,
  AssertAccountViewModelExistsService,
  ValidateAccountCredentialsService,
];

const DOMAIN_BUILDERS = [AccountBuilder, AuthSessionBuilder];

const INFRASTRUCTURE_MAPPERS = [AccountTypeOrmMapper, AuthSessionTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: ACCOUNT_WRITE_REPOSITORY,
    useClass: AccountTypeOrmWriteRepository,
  },
  { provide: ACCOUNT_READ_REPOSITORY, useClass: AccountTypeOrmReadRepository },
  {
    provide: AUTH_SESSION_WRITE_REPOSITORY,
    useClass: AuthSessionTypeOrmRepository,
  },
];

const INFRASTRUCTURE_ENTITIES = [AccountEntity, AuthSessionEntity];

const STRATEGIES = [LocalStrategy, JwtStrategy];

const GUARDS = [JwtAuthGuard, LocalAuthGuard];

const TRANSPORT_GRAPHQL_RESOLVERS = [AuthResolver];

const TRANSPORT_REST_CONTROLLERS = [AuthController];

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>('auth.jwtSecret') ?? process.env.JWT_SECRET,
        signOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresIn: (config.get<string>('auth.jwtExpiresIn') ??
            process.env.JWT_EXPIRES_IN ??
            '1d') as any,
        },
      }),
    }),
  ],
  controllers: [...TRANSPORT_REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...STRATEGIES,
    ...GUARDS,
    ...TRANSPORT_GRAPHQL_RESOLVERS,
  ],
  exports: [JwtAuthGuard, LocalAuthGuard, TokenService],
})
export class AuthModule {}
