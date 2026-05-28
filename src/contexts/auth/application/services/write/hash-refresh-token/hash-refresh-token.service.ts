import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

@Injectable()
export class HashRefreshTokenService implements IBaseService<string, string> {
  async execute(token: string): Promise<string> {
    return Promise.resolve(createHash('sha256').update(token).digest('hex'));
  }
}
