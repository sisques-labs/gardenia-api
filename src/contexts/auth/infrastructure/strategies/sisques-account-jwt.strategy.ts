import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { SisquesAccountPrincipalResolver } from '@contexts/auth/infrastructure/services/sisques-account-principal.resolver';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface SisquesAccountJwtPayload {
  sub: string;
  email: string;
  // Present on the platform's claims, deliberately NOT forwarded — see D3.
  platformAdmin?: boolean;
  tenants?: Array<{ tenantId: string; role: string }>;
}

/**
 * Verifies Sisques Account (the platform) RS256 access tokens against the
 * platform's published JWKS endpoint. Sibling to `JwtStrategy` — NOT a
 * modification of it (D1): gardenia's own 'jwt' strategy is untouched, this
 * is purely additive dual-issuer acceptance.
 *
 * `validate()` returns exactly `{userId, email, appRole}` — the same key set
 * as `JwtStrategy`, so `SpaceGuard`, `AppRoleGuard`, `@CurrentUser()` and MCP
 * context need no change (D3). `platformAdmin` and `tenants[]` are read here
 * and go no further.
 */
@Injectable()
export class SisquesAccountJwtStrategy extends PassportStrategy(
  Strategy,
  'sisques-account',
) {
  constructor(
    configService: ConfigService,
    private readonly principalResolver: SisquesAccountPrincipalResolver,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer: configService.get<string>('sisquesAccount.issuer'),
      audience: configService.get<string>('sisquesAccount.audience'),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: configService.get<string>('sisquesAccount.jwksUrl') ?? '',
      }),
    });
  }

  async validate(payload: SisquesAccountJwtPayload): Promise<{
    userId: string;
    email: string;
    appRole: AppRoleEnum;
  }> {
    // sub is looked up against accounts.external_subject — NEVER used as
    // userId directly (gardenia UUIDs are FK'd across ten contexts). appRole
    // comes from the same account-projection row (D5): zero extra queries
    // beyond the lookup the strategy already needs, and no cache so role
    // revocation stays immediate.
    return this.principalResolver.resolve({
      externalSubject: payload.sub,
      email: payload.email,
    });
  }
}
