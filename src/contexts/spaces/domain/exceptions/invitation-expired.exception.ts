import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvitationExpiredException extends BaseException {
  constructor(code: string) {
    super(`Invitation with code '${code}' has expired`);
  }
}
