import { ChangePasswordCommandHandler } from '@contexts/auth/application/commands/change-password/change-password.handler';
import { DeleteAccountCommandHandler } from '@contexts/auth/application/commands/delete-account/delete-account.handler';
import { IssueApiTokenCommandHandler } from '@contexts/auth/application/commands/issue-api-token/issue-api-token.handler';
import { RevokeApiTokenCommandHandler } from '@contexts/auth/application/commands/revoke-api-token/revoke-api-token.handler';
import { ApiTokenAuthenticateQueryHandler } from '@contexts/auth/application/queries/api-token-authenticate/api-token-authenticate.handler';
import { ApiTokenFindByUserQueryHandler } from '@contexts/auth/application/queries/api-token-find-by-user/api-token-find-by-user.handler';
import { GenerateApiTokenService } from '@contexts/auth/application/services/write/generate-api-token/generate-api-token.service';
import { ApiTokenBuilder } from '@contexts/auth/domain/builders/api-token.builder';
import { API_TOKEN_WRITE_REPOSITORY } from '@contexts/auth/domain/repositories/write/api-token-write.repository';
import { ApiTokenEntity } from '@contexts/auth/infrastructure/persistence/typeorm/entities/api-token.entity';
import { ApiTokenTypeOrmMapper } from '@contexts/auth/infrastructure/persistence/typeorm/mappers/api-token-typeorm.mapper';
import { ApiTokenTypeOrmWriteRepository } from '@contexts/auth/infrastructure/persistence/typeorm/repositories/api-token-typeorm-write.repository';
import { ApiTokenController } from '@contexts/auth/transport/rest/controllers/api-token.controller';
import { LoginAccountCommandHandler } from '@contexts/auth/application/commands/login-account/login-account.handler';
import { LogoutAllCommandHandler } from '@contexts/auth/application/commands/logout-all/logout-all.handler';
import { LogoutCommandHandler } from '@contexts/auth/application/commands/logout/logout.handler';
import { LinkOAuthIdentityCommandHandler } from '@contexts/auth/application/commands/oauth/link-oauth-identity/link-oauth-identity.handler';
import { LoginWithOAuthCommandHandler } from '@contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.handler';
import { RefreshTokenCommandHandler } from '@contexts/auth/application/commands/refresh-token/refresh-token.handler';
import { EncryptionService } from '@contexts/auth/application/services/encryption/encryption.service';
import { OAuthStateService } from '@contexts/auth/application/services/oauth/oauth-state.service';
import { ValidateAccountCredentialsService } from '@contexts/auth/application/services/read/validate-account-credentials/validate-account-credentials.service';
import { GenerateRefreshTokenService } from '@contexts/auth/application/services/write/generate-refresh-token/generate-refresh-token.service';
import { HashRefreshTokenService } from '@contexts/auth/application/services/write/hash-refresh-token/hash-refresh-token.service';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { AUTH_SESSION_WRITE_REPOSITORY } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import { OAUTH_IDENTITY_WRITE_REPOSITORY } from '@contexts/auth/domain/repositories/write/oauth-identity-write.repository';
import { AuthSessionEntity } from '@contexts/auth/infrastructure/persistence/typeorm/entities/auth-session.entity';
import { OAuthIdentityTypeOrmEntity } from '@contexts/auth/infrastructure/persistence/typeorm/entities/oauth-identity.entity';
import { AuthSessionTypeOrmMapper } from '@contexts/auth/infrastructure/persistence/typeorm/mappers/auth-session-typeorm.mapper';
import { OAuthIdentityTypeOrmMapper } from '@contexts/auth/infrastructure/persistence/typeorm/mappers/oauth-identity-typeorm.mapper';
import { AuthSessionTypeOrmWriteRepository } from '@contexts/auth/infrastructure/persistence/typeorm/repositories/auth-session-typeorm-write.repository';
import { OAuthIdentityTypeOrmWriteRepository } from '@contexts/auth/infrastructure/persistence/typeorm/repositories/oauth-identity-typeorm-write.repository';
import { SPACE_PROVISIONING_PORT } from '@contexts/auth/application/ports/space-provisioning.port';
import { USER_PROVISIONING_PORT } from '@contexts/auth/application/ports/user-provisioning.port';
import { SpaceProvisioningAdapter } from '@contexts/auth/infrastructure/adapters/space-provisioning.adapter';
import { UserProvisioningAdapter } from '@contexts/auth/infrastructure/adapters/user-provisioning.adapter';
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
import { AppRoleGuard } from './infrastructure/guards/app-role.guard';
import { DynamicOAuthGuard } from './infrastructure/guards/dynamic-oauth.guard';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { LocalAuthGuard } from './infrastructure/guards/local-auth.guard';
import { OAuthProviderRegistry } from './infrastructure/oauth/oauth-provider.registry';
import { AccountTypeOrmReadRepository } from './infrastructure/persistence/typeorm/account-typeorm-read.repository';
import { AccountTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/account-typeorm-write.repository';
import { AccountTypeOrmMapper } from './infrastructure/persistence/typeorm/account-typeorm.mapper';
import { AccountEntity } from './infrastructure/persistence/typeorm/account.entity';
import { AppleOAuthStrategy } from './infrastructure/strategies/oauth/apple/apple-oauth.strategy';
import { GithubOAuthStrategy } from './infrastructure/strategies/oauth/github/github-oauth.strategy';
import { GoogleOAuthStrategy } from './infrastructure/strategies/oauth/google/google-oauth.strategy';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { AccountGraphQLMapper } from './transport/graphql/mappers/account/account.mapper';
import { AuthMutationsResolver } from './transport/graphql/resolvers/auth/auth-mutations.resolver';
import { AuthQueriesResolver } from './transport/graphql/resolvers/auth/auth-queries.resolver';
import { AccountRestMapper } from './transport/rest/mappers/account/account.mapper';
import { AuthController } from './transport/rest/controllers/auth.controller';
import { OAuthController } from './transport/rest/controllers/oauth.controller';
import { RefreshCookieService } from './transport/shared/refresh-cookie.service';

const COMMAND_HANDLERS = [
  ChangePasswordCommandHandler,
  DeleteAccountCommandHandler,
  RegisterAccountCommandHandler,
  LoginAccountCommandHandler,
  RefreshTokenCommandHandler,
  LogoutCommandHandler,
  LogoutAllCommandHandler,
  LinkOAuthIdentityCommandHandler,
  LoginWithOAuthCommandHandler,
  IssueApiTokenCommandHandler,
  RevokeApiTokenCommandHandler,
];

const QUERY_HANDLERS = [
  AccountFindByIdQueryHandler,
  AccountFindByCriteriaQueryHandler,
  ApiTokenAuthenticateQueryHandler,
  ApiTokenFindByUserQueryHandler,
];

const APPLICATION_SERVICES = [
  AuthService,
  TokenService,
  AssertAccountExistsService,
  AssertAccountEmailAvailableService,
  AssertAccountViewModelExistsService,
  ValidateAccountCredentialsService,
  GenerateRefreshTokenService,
  HashRefreshTokenService,
  GenerateApiTokenService,
  RefreshCookieService,
  OAuthStateService,
  EncryptionService,
];

const DOMAIN_BUILDERS = [
  AccountBuilder,
  AuthSessionBuilder,
  OAuthIdentityBuilder,
  ApiTokenBuilder,
];

const INFRASTRUCTURE_MAPPERS = [
  AccountTypeOrmMapper,
  AuthSessionTypeOrmMapper,
  OAuthIdentityTypeOrmMapper,
  ApiTokenTypeOrmMapper,
];

const TRANSPORT_MAPPERS = [AccountRestMapper, AccountGraphQLMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: ACCOUNT_WRITE_REPOSITORY,
    useClass: AccountTypeOrmWriteRepository,
  },
  { provide: ACCOUNT_READ_REPOSITORY, useClass: AccountTypeOrmReadRepository },
  {
    provide: AUTH_SESSION_WRITE_REPOSITORY,
    useClass: AuthSessionTypeOrmWriteRepository,
  },
  {
    provide: OAUTH_IDENTITY_WRITE_REPOSITORY,
    useClass: OAuthIdentityTypeOrmWriteRepository,
  },
  {
    provide: API_TOKEN_WRITE_REPOSITORY,
    useClass: ApiTokenTypeOrmWriteRepository,
  },
];

const INFRASTRUCTURE_ENTITIES = [
  AccountEntity,
  AuthSessionEntity,
  OAuthIdentityTypeOrmEntity,
  ApiTokenEntity,
];

const INFRASTRUCTURE_ADAPTERS = [
  { provide: USER_PROVISIONING_PORT, useClass: UserProvisioningAdapter },
  { provide: SPACE_PROVISIONING_PORT, useClass: SpaceProvisioningAdapter },
];

const STRATEGIES = [
  LocalStrategy,
  JwtStrategy,
  {
    provide: GoogleOAuthStrategy,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const clientId = config.get<string>('auth.googleClientId');
      return clientId ? new GoogleOAuthStrategy(config) : null;
    },
  },
  {
    provide: GithubOAuthStrategy,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const clientId = config.get<string>('auth.githubClientId');
      return clientId ? new GithubOAuthStrategy(config) : null;
    },
  },
  {
    provide: AppleOAuthStrategy,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const clientId = config.get<string>('auth.appleClientId');
      return clientId ? new AppleOAuthStrategy(config) : null;
    },
  },
];

const GUARDS = [JwtAuthGuard, LocalAuthGuard, DynamicOAuthGuard, AppRoleGuard];

const OAUTH_INFRASTRUCTURE = [OAuthProviderRegistry];

const TRANSPORT_GRAPHQL_RESOLVERS = [
  AuthQueriesResolver,
  AuthMutationsResolver,
];

const TRANSPORT_REST_CONTROLLERS = [
  AuthController,
  OAuthController,
  ApiTokenController,
];

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
    ...TRANSPORT_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...INFRASTRUCTURE_ADAPTERS,
    ...STRATEGIES,
    ...GUARDS,
    ...OAUTH_INFRASTRUCTURE,
    ...TRANSPORT_GRAPHQL_RESOLVERS,
  ],
  exports: [JwtAuthGuard, LocalAuthGuard, AppRoleGuard, TokenService],
})
export class AuthModule {}
