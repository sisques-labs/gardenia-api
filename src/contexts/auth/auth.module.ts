import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegisterAccountCommandHandler } from './application/commands/register-account/register-account.handler';
import { LoginUserCommandHandler } from './application/commands/login-user/login-user.handler';
import { AuthService } from './application/services/auth.service';
import { TokenService } from './application/services/token.service';
import { ACCOUNT_WRITE_REPOSITORY } from './domain/repositories/i-account-write.repository';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { LocalAuthGuard } from './infrastructure/guards/local-auth.guard';
import { AccountEntity } from './infrastructure/persistence/typeorm/account.entity';
import { AccountTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/account-typeorm-write.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { AuthController } from './transport/rest/auth.controller';
import { AuthResolver } from './transport/graphql/auth.resolver';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    TypeOrmModule.forFeature([AccountEntity]),
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
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    RegisterAccountCommandHandler,
    LoginUserCommandHandler,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    AuthResolver,
    { provide: ACCOUNT_WRITE_REPOSITORY, useClass: AccountTypeOrmWriteRepository },
  ],
  exports: [JwtAuthGuard, LocalAuthGuard, TokenService],
})
export class AuthModule {}
