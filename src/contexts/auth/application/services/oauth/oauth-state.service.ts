import { OAuthStateMismatchException } from '@contexts/auth/domain/exceptions/oauth-state-mismatch.exception';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export type OAuthProviderName = 'google' | 'github' | 'apple';

export interface StatePayload {
  nonce: string;
  provider: OAuthProviderName;
  iat: number;
  exp: number;
}

@Injectable()
export class OAuthStateService {
  private readonly secret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>('auth.oauthStateSecret') ?? '';
  }

  issue(provider: OAuthProviderName): string {
    const nonce = Math.random().toString(36).substring(2);
    return this.jwtService.sign(
      { nonce, provider },
      { secret: this.secret, expiresIn: '2m' },
    );
  }

  verify(state: string, provider: OAuthProviderName): StatePayload {
    try {
      const payload = this.jwtService.verify<StatePayload>(state, {
        secret: this.secret,
      });

      if (payload.provider !== provider) {
        throw new OAuthStateMismatchException();
      }

      return payload;
    } catch (err) {
      if (err instanceof OAuthStateMismatchException) throw err;
      throw new OAuthStateMismatchException();
    }
  }
}
