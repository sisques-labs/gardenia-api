import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

@Injectable()
export class GenerateRefreshTokenService implements IBaseService {
  async execute(): Promise<string> {
    return Promise.resolve(randomBytes(32).toString('base64url'));
  }
}
