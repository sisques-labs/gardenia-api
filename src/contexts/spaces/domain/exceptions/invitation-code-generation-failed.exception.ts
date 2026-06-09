import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvitationCodeGenerationFailedException extends BaseException {
  constructor() {
    super('Failed to generate a unique invitation code');
  }
}
