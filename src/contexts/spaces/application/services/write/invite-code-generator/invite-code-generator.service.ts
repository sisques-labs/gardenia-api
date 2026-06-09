import { Injectable, Logger } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';
import { randomBytes } from 'crypto';

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export interface InviteCodeGeneratorServiceInput {
  spaceName: string;
}

export interface InviteCodeGeneratorServiceOutput {
  code: string;
  displayCode: string;
}

@Injectable()
export class InviteCodeGeneratorService implements IBaseService<
  InviteCodeGeneratorServiceInput,
  InviteCodeGeneratorServiceOutput
> {
  private readonly logger = new Logger(InviteCodeGeneratorService.name);

  async execute(
    input: InviteCodeGeneratorServiceInput,
  ): Promise<InviteCodeGeneratorServiceOutput> {
    const letters = input.spaceName.replace(/[^A-Za-z]/g, '').toUpperCase();
    const word = (letters.slice(0, 3) || 'INV').padEnd(3, 'X');
    const year = new Date().getUTCFullYear();
    const suffix = this.randomSuffix(2);
    const code = `${word}${year}${suffix}`;
    const displayCode = `${word} · ${year} · ${suffix}`;

    this.logger.log(`Generated invite code prefix ${word}${year} for space`);

    return { code, displayCode };
  }

  private randomSuffix(length: number): string {
    const bytes = randomBytes(length);
    let suffix = '';
    for (let i = 0; i < length; i++) {
      suffix += CROCKFORD_BASE32[bytes[i] % CROCKFORD_BASE32.length];
    }
    return suffix;
  }
}
