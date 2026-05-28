import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenService {
  generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
