import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { LoginUserCommandHandler } from './application/commands/login-user/login-user.handler';
import { AuthService } from './application/services/auth.service';
import { TokenService } from './application/services/token.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { LocalAuthGuard } from './infrastructure/guards/local-auth.guard';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { AuthController } from './transport/rest/auth.controller';
import { AuthResolver } from './transport/graphql/auth.resolver';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
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
    LoginUserCommandHandler,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    AuthResolver,
  ],
  exports: [JwtAuthGuard, LocalAuthGuard, TokenService],
})
export class AuthModule {}
