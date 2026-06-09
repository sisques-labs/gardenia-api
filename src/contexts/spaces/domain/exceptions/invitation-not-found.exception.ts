import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvitationNotFoundException extends BaseException {
  constructor(code: string) {
    super(`Invitation with code '${code}' was not found`);
  }
}
