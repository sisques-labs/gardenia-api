import { BaseException } from '@sisques-labs/nestjs-kit';

export class TenantMembershipQueryUnavailableException extends BaseException {
  constructor(reason?: string) {
    super(
      `The platform tenant-membership API is unavailable${reason ? `: ${reason}` : ''}`,
    );
  }
}
