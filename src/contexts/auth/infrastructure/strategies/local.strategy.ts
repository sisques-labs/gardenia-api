import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { AuthService } from '../../application/services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<{ userId: string; email: string }> {
    const account = await this.authService.validateAccount(email, password);
    if (!account) {
      throw new InvalidCredentialsException();
    }
    return { userId: account.userId, email: account.email };
  }
}
